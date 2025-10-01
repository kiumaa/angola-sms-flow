-- Enhanced SMTP settings security: restrict direct SELECT access

-- 1) Update RLS policy to be more restrictive - only allow INSERT/UPDATE/DELETE, not SELECT
-- This forces admins to use the get_masked_smtp_settings() function for viewing
DROP POLICY IF EXISTS "Only verified admins can access SMTP settings" ON public.smtp_settings;

-- Separate policies for different operations
CREATE POLICY "Admins can insert SMTP settings"
ON public.smtp_settings
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session()
);

CREATE POLICY "Admins can update SMTP settings"
ON public.smtp_settings
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session() 
  AND enhanced_security_rate_limit('smtp_settings_access'::text, 20, 5)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session()
);

CREATE POLICY "Admins can delete SMTP settings"
ON public.smtp_settings
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session()
);

-- Service role needs SELECT for system operations
CREATE POLICY "Service role can select SMTP settings"
ON public.smtp_settings
FOR SELECT
TO service_role
USING (true);

-- Log this security hardening
INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'smtp_settings_security_hardened',
  jsonb_build_object(
    'changes', jsonb_build_array(
      'Removed direct SELECT access for authenticated admins',
      'Admins must use get_masked_smtp_settings() RPC',
      'Separated RLS policies by operation type',
      'Service role retains SELECT for system operations only'
    ),
    'security_improvement', 'encrypted_passwords_no_longer_exposed_via_direct_queries',
    'mitigation', 'admins_can_only_see_masked_passwords_via_secure_rpc_function',
    'timestamp', now()
  ),
  inet_client_addr()
);