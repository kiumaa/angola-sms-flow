-- PHASE 2: Function Search Path Security
-- Fixes: 0011_function_search_path_mutable warning

-- Fix prevent_self_admin_promotion function
CREATE OR REPLACE FUNCTION public.prevent_self_admin_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.role = 'admin'::app_role AND NEW.user_id = auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
      AND user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Cannot promote yourself to admin role';
    END IF;
  END IF;
  
  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details, ip_address)
  VALUES (
    auth.uid(),
    'role_change_attempt',
    NEW.user_id,
    jsonb_build_object('new_role', NEW.role, 'self_promotion_blocked', NEW.user_id = auth.uid()),
    inet_client_addr()
  );
  
  RETURN NEW;
END;
$$;

-- Fix validate_admin_operations_credit_adjustments function
CREATE OR REPLACE FUNCTION public.validate_admin_operations_credit_adjustments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only administrators can adjust user credits';
  END IF;
  
  IF abs(NEW.delta) > 100000 THEN
    PERFORM log_security_event(
      'suspicious_credit_adjustment',
      auth.uid(),
      jsonb_build_object('target_user', NEW.user_id, 'delta', NEW.delta, 'flagged', 'extremely_large_adjustment')
    );
    RAISE EXCEPTION 'Credit adjustment exceeds maximum allowed amount';
  END IF;
  
  IF NOT enhanced_security_rate_limit('credit_adjustment', 10, 5) THEN
    RAISE EXCEPTION 'Rate limit exceeded for credit adjustments';
  END IF;
  
  INSERT INTO public.admin_audit_logs (admin_id, action, target_user_id, details, ip_address)
  VALUES (
    auth.uid(),
    'credit_adjustment_validated',
    NEW.user_id,
    jsonb_build_object('delta', NEW.delta, 'adjustment_type', NEW.adjustment_type, 'reason', NEW.reason),
    inet_client_addr()
  );
  
  RETURN NEW;
END;
$$;

-- Create function call audit table
CREATE TABLE IF NOT EXISTS public.function_call_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  called_at timestamp with time zone NOT NULL DEFAULT now(),
  caller_id uuid,
  function_name text NOT NULL,
  parameters jsonb,
  execution_time_ms integer,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  ip_address inet
);

ALTER TABLE public.function_call_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view function call audit"
ON public.function_call_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_function_audit_called_at 
ON public.function_call_audit(called_at DESC);

-- Log completion
INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
VALUES (
  COALESCE((SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_phase2_completed',
  '{"phase": 2, "description": "Function search_path security", "warnings_fixed": ["0011_function_search_path_mutable"]}'::jsonb,
  inet_client_addr()
);