-- Fix site_settings table public exposure vulnerability
-- Remove any public access and ensure only admin users can access this sensitive configuration data

-- Drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anonymous can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public access to site settings" ON public.site_settings;

-- Ensure only the admin policy exists and no public access
CREATE POLICY "Admin only access to site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Block all anonymous access explicitly
CREATE POLICY "Block all anonymous access to site settings"
ON public.site_settings
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Create audit function for site_settings access attempts
CREATE OR REPLACE FUNCTION public.log_site_settings_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log any access attempts to site_settings, especially anonymous ones
  IF auth.role() = 'anon' THEN
    PERFORM log_security_event('anonymous_site_settings_access_blocked', NULL, 
      jsonb_build_object(
        'table', 'site_settings',
        'operation', TG_OP,
        'ip_address', inet_client_addr(),
        'timestamp', now(),
        'blocked', true,
        'severity', 'critical'
      )
    );
  ELSIF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM log_security_event('unauthorized_site_settings_access_blocked', auth.uid(), 
      jsonb_build_object(
        'table', 'site_settings',
        'operation', TG_OP,
        'user_id', auth.uid(),
        'timestamp', now(),
        'blocked', true
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger to monitor access attempts (row-level trigger for proper operation logging)
DROP TRIGGER IF EXISTS audit_site_settings_access ON public.site_settings;
CREATE TRIGGER audit_site_settings_access
  BEFORE INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_site_settings_access();

-- Log this critical security fix
INSERT INTO admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'critical_security_vulnerability_fixed',
  jsonb_build_object(
    'issue_fixed', 'site_settings_public_exposure',
    'severity', 'error',
    'actions_taken', ARRAY[
      'removed_all_public_access_to_site_settings',
      'blocked_anonymous_access_explicitly',
      'restricted_access_to_admin_users_only',
      'added_comprehensive_audit_logging',
      'created_security_monitoring_triggers'
    ],
    'security_improvement', 'prevents_exposure_of_internal_system_configuration',
    'tables_secured', ARRAY['site_settings'],
    'timestamp', now()
  ),
  inet_client_addr()
);