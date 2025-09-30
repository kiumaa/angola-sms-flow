-- Security Fix: Convert safe_profiles to SECURITY INVOKER
-- This makes the view check RLS policies as the querying user, not the view owner

-- Drop and recreate the view with security_invoker option
DROP VIEW IF EXISTS public.safe_profiles CASCADE;

CREATE VIEW public.safe_profiles
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  created_at,
  user_status,
  CASE 
    WHEN user_status = 'active' THEN 'Ativo'
    WHEN user_status = 'inactive' THEN 'Inativo'
    ELSE 'Desconhecido'
  END as status_display
FROM public.profiles
WHERE user_status = 'active';

-- Set ownership and permissions
ALTER VIEW public.safe_profiles OWNER TO postgres;
REVOKE ALL ON public.safe_profiles FROM PUBLIC;
GRANT SELECT ON public.safe_profiles TO anon, authenticated;

-- Add security documentation
COMMENT ON VIEW public.safe_profiles IS 
'SECURITY INVOKER VIEW: Safe public view containing only non-PII data (user_id, created_at, user_status). 
This view uses SECURITY INVOKER mode, meaning RLS policies are checked as the querying user.
Contains NO email, phone, name, or other personal data. Approved for public access.';

-- Log the security improvement
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'security_view_updated',
  jsonb_build_object(
    'view_name', 'safe_profiles',
    'security_mode', 'SECURITY INVOKER',
    'previous_mode', 'SECURITY DEFINER (default)',
    'security_improvement', 'rls_checked_as_querying_user',
    'timestamp', now()
  ),
  inet_client_addr()
);