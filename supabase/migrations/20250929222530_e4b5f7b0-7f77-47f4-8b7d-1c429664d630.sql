-- Add explicit policy to deny all anonymous access to profiles table
-- This provides defense in depth against potential data exposure

CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add audit logging for any attempts to access profiles
CREATE OR REPLACE FUNCTION public.log_profile_access_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log anonymous access attempts to profiles
  IF auth.role() = 'anon' THEN
    PERFORM log_security_event('anonymous_profile_access_attempt', NULL, 
      jsonb_build_object(
        'table', 'profiles',
        'operation', TG_OP,
        'ip_address', inet_client_addr(),
        'timestamp', now(),
        'blocked', true
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to monitor profile access attempts (valid syntax)
DROP TRIGGER IF EXISTS audit_profile_access_attempts ON public.profiles;
CREATE TRIGGER audit_profile_access_attempts
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_access_attempt();

-- Add comprehensive logging for profile data access
INSERT INTO admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'profiles_security_enhancement',
  jsonb_build_object(
    'action', 'added_anonymous_access_block',
    'table', 'profiles',
    'security_improvement', 'explicit_anonymous_denial_policy',
    'timestamp', now(),
    'rationale', 'prevent_customer_data_exposure_to_hackers'
  ),
  inet_client_addr()
);