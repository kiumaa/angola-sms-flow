-- Security Fix 1: Remove public access to credit_packages and restrict to authenticated users only
DROP POLICY IF EXISTS "Public can view active packages" ON public.credit_packages;

-- Create more secure policy for authenticated users only
CREATE POLICY "Authenticated users can view active packages"
ON public.credit_packages
FOR SELECT
TO authenticated
USING (is_active = true);

-- Security Fix 2: Enhance user_roles table security to prevent privilege escalation
-- Add trigger to validate role changes and prevent self-promotion to admin
CREATE OR REPLACE FUNCTION prevent_self_admin_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from granting themselves admin role
  IF NEW.role = 'admin'::app_role AND NEW.user_id = auth.uid() THEN
    -- Check if the current user is already an admin (only admins can promote others)
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Security violation: Users cannot grant themselves admin privileges';
    END IF;
  END IF;
  
  -- Log all role change attempts for audit
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

-- Add trigger to user_roles table
DROP TRIGGER IF EXISTS validate_role_changes ON public.user_roles;
CREATE TRIGGER validate_role_changes
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_admin_promotion();

-- Security Fix 3: Add additional validation for sensitive operations
CREATE OR REPLACE FUNCTION validate_admin_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Enhanced validation for admin operations
  IF TG_TABLE_NAME IN ('credit_adjustments', 'sms_configurations', 'gateway_overrides') THEN
    -- Require active admin session
    IF NOT (has_role(auth.uid(), 'admin'::app_role) AND validate_user_session()) THEN
      PERFORM log_security_event('unauthorized_admin_operation', auth.uid(), 
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'blocked', true
        )
      );
      RAISE EXCEPTION 'Unauthorized: Admin privileges required with valid session';
    END IF;
    
    -- Rate limiting for admin operations
    IF NOT enhanced_security_rate_limit('admin_operation', 50, 5) THEN
      RAISE EXCEPTION 'Admin operation rate limit exceeded';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to sensitive tables
CREATE TRIGGER validate_admin_operations_credit_adjustments
  BEFORE INSERT OR UPDATE OR DELETE ON public.credit_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_session();

CREATE TRIGGER validate_admin_operations_sms_configs
  BEFORE INSERT OR UPDATE OR DELETE ON public.sms_configurations
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_session();

CREATE TRIGGER validate_admin_operations_gateway_overrides
  BEFORE INSERT OR UPDATE OR DELETE ON public.gateway_overrides
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_session();

-- Security Fix 4: Enhance contact data protection
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS data_classification text DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS last_accessed timestamp with time zone DEFAULT now();

-- Add trigger to log sensitive data access
CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to contact data
  IF TG_OP = 'SELECT' THEN
    UPDATE public.contacts 
    SET last_accessed = now() 
    WHERE id = NEW.id;
    
    -- Log bulk access attempts
    PERFORM log_security_event('contact_data_accessed', auth.uid(), 
      jsonb_build_object(
        'contact_id', NEW.id,
        'data_classification', NEW.data_classification,
        'access_pattern', 'individual'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Fix 5: Add constraint to prevent data integrity issues
ALTER TABLE public.profiles 
ADD CONSTRAINT check_credits_non_negative CHECK (credits >= 0),
ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

-- Add constraint to prevent invalid phone numbers in contacts
ALTER TABLE public.contacts
ADD CONSTRAINT check_phone_format CHECK (
  phone ~ '^\+244[9][0-9]{8}$' OR phone_e164 IS NOT NULL
);