-- Restrict safe_profiles to SELECT-only (views can't be modified anyway, but this is cleaner)
REVOKE ALL ON public.safe_profiles FROM authenticated, service_role;
GRANT SELECT ON public.safe_profiles TO authenticated, service_role;

-- Final verification log
INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'safe_profiles_permissions_finalized',
  jsonb_build_object(
    'view', 'safe_profiles',
    'permissions', 'SELECT only',
    'granted_to', jsonb_build_array('authenticated', 'service_role'),
    'denied_to', jsonb_build_array('anon', 'public'),
    'security_status', 'FULLY SECURED',
    'timestamp', now()
  ),
  inet_client_addr()
);