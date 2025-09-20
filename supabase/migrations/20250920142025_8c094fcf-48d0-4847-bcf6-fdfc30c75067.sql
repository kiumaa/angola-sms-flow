-- Fix Campaign Stats RLS Policy Security Issue
-- Replace overly permissive "true" policy with proper service role validation

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "System can update campaign stats" ON public.campaign_stats;

-- Create a more secure policy that only allows system operations via service role
CREATE POLICY "System can manage campaign stats via service role" 
ON public.campaign_stats 
FOR ALL 
USING (
  -- Only allow service role operations (for system updates)
  current_setting('role') = 'service_role' OR
  -- Or authenticated users viewing their own campaign stats
  (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_stats.campaign_id 
      AND c.account_id = get_current_account_id()
    )
  )
)
WITH CHECK (
  -- Only service role can insert/update
  current_setting('role') = 'service_role' OR
  -- Or authenticated users can view (no insert/update for regular users)
  (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_stats.campaign_id 
      AND c.account_id = get_current_account_id()
    )
  )
);

-- Add additional security validation function for campaign stats operations
CREATE OR REPLACE FUNCTION public.validate_campaign_stats_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any direct attempts to modify campaign stats by non-service roles
  IF current_setting('role') != 'service_role' AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    PERFORM log_security_event('unauthorized_campaign_stats_modification', auth.uid(), 
      jsonb_build_object(
        'operation', TG_OP,
        'campaign_id', COALESCE(NEW.campaign_id, OLD.campaign_id),
        'role', current_setting('role'),
        'timestamp', now()
      )
    );
    
    -- Block the operation for non-service roles
    RAISE EXCEPTION 'Unauthorized: Campaign stats can only be modified by system operations';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate campaign stats operations
CREATE TRIGGER validate_campaign_stats_security
  BEFORE INSERT OR UPDATE OR DELETE ON public.campaign_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_campaign_stats_operation();

-- Enhanced rate limiting for security-sensitive operations
CREATE OR REPLACE FUNCTION public.enhanced_security_rate_limit(
  operation_type text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
) RETURNS boolean AS $$
DECLARE
  recent_attempts integer;
  current_user_id uuid := auth.uid();
  current_ip inet := inet_client_addr();
BEGIN
  -- Count recent attempts by user ID and IP
  SELECT COUNT(*) INTO recent_attempts
  FROM admin_audit_logs
  WHERE (
    (admin_id = current_user_id) OR 
    (ip_address = current_ip)
  )
  AND action LIKE '%' || operation_type || '%'
  AND created_at > now() - (window_minutes || ' minutes')::interval;
  
  -- Block if rate limit exceeded
  IF recent_attempts >= max_attempts THEN
    -- Log the rate limit violation
    PERFORM log_security_event('rate_limit_exceeded', current_user_id, 
      jsonb_build_object(
        'operation_type', operation_type,
        'attempts', recent_attempts,
        'max_attempts', max_attempts,
        'window_minutes', window_minutes,
        'ip_address', current_ip
      )
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add security monitoring for admin operations
CREATE OR REPLACE FUNCTION public.monitor_admin_operations()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid := auth.uid();
  suspicious_patterns text[];
BEGIN
  -- Check for suspicious admin operation patterns
  suspicious_patterns := ARRAY[]::text[];
  
  -- Check for rapid role changes
  IF TG_TABLE_NAME = 'user_roles' AND TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Check if user is making many role changes quickly
    IF NOT enhanced_security_rate_limit('role_change', 3, 10) THEN
      suspicious_patterns := array_append(suspicious_patterns, 'rapid_role_changes');
    END IF;
  END IF;
  
  -- Check for bulk operations
  IF TG_TABLE_NAME = 'credit_adjustments' AND TG_OP = 'INSERT' THEN
    IF NOT enhanced_security_rate_limit('credit_adjustment', 10, 5) THEN
      suspicious_patterns := array_append(suspicious_patterns, 'bulk_credit_adjustments');
    END IF;
  END IF;
  
  -- Log suspicious patterns
  IF array_length(suspicious_patterns, 1) > 0 THEN
    PERFORM log_security_event('suspicious_admin_activity', current_user_id, 
      jsonb_build_object(
        'patterns', suspicious_patterns,
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply security monitoring to critical tables
CREATE TRIGGER monitor_user_roles_security
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_admin_operations();

CREATE TRIGGER monitor_credit_adjustments_security
  AFTER INSERT OR UPDATE OR DELETE ON public.credit_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_admin_operations();