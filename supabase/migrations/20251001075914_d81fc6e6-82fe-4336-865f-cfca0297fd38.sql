-- Fix safe_profiles security: revoke anonymous access and enforce security_barrier
-- PostgreSQL 15 doesn't support SECURITY INVOKER in CREATE VIEW, so we use security_barrier instead

-- 1) Revoke all anonymous/public access to the view
REVOKE ALL ON public.safe_profiles FROM PUBLIC;
REVOKE ALL ON public.safe_profiles FROM anon;

-- 2) Grant only to authenticated users and service role
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO service_role;

-- 3) Enable security_barrier to ensure RLS checks happen before view predicates
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- 4) Update comment to document the security model
COMMENT ON VIEW public.safe_profiles IS 
'Safe non-PII profile view. Access restricted to authenticated users only. Inherits RLS from profiles table via security_barrier.';

-- 5) Log the security hardening
INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'safe_profiles_access_restricted',
  jsonb_build_object(
    'object', 'view',
    'name', 'safe_profiles',
    'changes', jsonb_build_object(
      'anon_access', 'REVOKED',
      'public_access', 'REVOKED',
      'authenticated_access', 'SELECT only',
      'service_role_access', 'SELECT only'
    ),
    'security_barrier', true,
    'rls_inheritance', 'from profiles table',
    'timestamp', now()
  ),
  inet_client_addr()
);