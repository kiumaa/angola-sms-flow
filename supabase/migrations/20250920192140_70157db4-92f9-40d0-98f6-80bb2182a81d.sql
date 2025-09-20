-- Security Fix 1: Remove public access to credit_packages and make it authenticated only
DROP POLICY IF EXISTS "Public can view active packages" ON public.credit_packages;
DROP POLICY IF EXISTS "Authenticated users can view active packages" ON public.credit_packages;

-- Create secure policy for authenticated users only
CREATE POLICY "Authenticated users can view active packages"
ON public.credit_packages
FOR SELECT
TO authenticated
USING (is_active = true);

-- Security Fix 2: Enhance user_roles table security
CREATE OR REPLACE FUNCTION prevent_self_admin_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from granting themselves admin role
  IF NEW.role = 'admin'::app_role AND NEW.user_id = auth.uid() THEN
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Security violation: Users cannot grant themselves admin privileges';
    END IF;
  END IF;
  
  PERFORM log_security_event('role_change_attempt', NEW.user_id, 
    jsonb_build_object(
      'old_role', CASE WHEN TG_OP = 'UPDATE' THEN OLD.role ELSE NULL END,
      'new_role', NEW.role,
      'attempted_by', auth.uid(),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_role_changes ON public.user_roles;
CREATE TRIGGER validate_role_changes
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_admin_promotion();

-- Security Fix 3: Enhanced admin session validation
CREATE OR REPLACE FUNCTION validate_admin_session()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME IN ('credit_adjustments', 'sms_configurations', 'gateway_overrides') THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role) AND validate_user_session()) THEN
      PERFORM log_security_event('unauthorized_admin_operation', auth.uid(), 
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'blocked', true)
      );
      RAISE EXCEPTION 'Unauthorized: Admin privileges required with valid session';
    END IF;
    
    IF NOT enhanced_security_rate_limit('admin_operation', 50, 5) THEN
      RAISE EXCEPTION 'Admin operation rate limit exceeded';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation triggers
DROP TRIGGER IF EXISTS validate_admin_operations_credit_adjustments ON public.credit_adjustments;
CREATE TRIGGER validate_admin_operations_credit_adjustments
  BEFORE INSERT OR UPDATE OR DELETE ON public.credit_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_session();

-- Security Fix 4: Add data integrity constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS check_credits_non_negative CHECK (credits >= 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS check_email_format CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL
);