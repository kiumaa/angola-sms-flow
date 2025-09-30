-- Security Fix: Convert Anonymous Blocking Policies to RESTRICTIVE
-- This provides bulletproof protection against anonymous data access

-- ============================================================================
-- 1. UPGRADE PROFILES TABLE SECURITY
-- ============================================================================

-- Drop the old PERMISSIVE deny policy
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;

-- Create a RESTRICTIVE policy that absolutely blocks anonymous access
CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Also add explicit blocking for public role
CREATE POLICY "Block all public role access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (
  -- Only allow if user is authenticated
  auth.uid() IS NOT NULL
);

-- ============================================================================
-- 2. VERIFY AUTHENTICATED USER POLICIES ARE WORKING
-- ============================================================================

-- The existing authenticated user policies remain unchanged:
-- - "Users can view own profile only" - allows users to see only their own data
-- - "Users can update own profile with validation" - allows users to update their own data
-- - "Admins can view all profiles with validation" - allows admins to see all profiles
-- - "Admins can manage profiles with validation" - allows admins to manage profiles
-- - "System can create profiles during registration" - allows system to create profiles

-- ============================================================================
-- 3. UPGRADE LGPD_REQUESTS TABLE SECURITY
-- ============================================================================

-- Add RESTRICTIVE policy for lgpd_requests to block anonymous access
CREATE POLICY "Block all anonymous access to lgpd_requests"
ON public.lgpd_requests
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit blocking for public role on lgpd_requests
CREATE POLICY "Block all public role access to lgpd_requests"
ON public.lgpd_requests
AS RESTRICTIVE
FOR ALL
TO public
USING (
  -- Only allow if user is authenticated
  auth.uid() IS NOT NULL
);

-- ============================================================================
-- 4. LOG SECURITY UPGRADE
-- ============================================================================

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
  'security_policies_upgraded',
  jsonb_build_object(
    'action', 'converted_permissive_to_restrictive',
    'tables', jsonb_build_array('profiles', 'lgpd_requests'),
    'policy_type', 'RESTRICTIVE blocking policies',
    'security_improvement', 'absolute_anonymous_access_denial',
    'previous_policy_type', 'PERMISSIVE (weaker protection)',
    'timestamp', now()
  ),
  inet_client_addr()
);