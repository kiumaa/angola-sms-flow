-- =====================================================
-- CRITICAL SECURITY FIX: Profiles Table RLS Policies
-- =====================================================
-- Issue: Overly permissive policy could allow authenticated users 
-- to access other users' profile data
-- Fix: Remove the problematic policy and ensure all access is properly scoped
-- =====================================================

-- Drop the problematic overly permissive policy
DROP POLICY IF EXISTS "Block all public role access to profiles" ON public.profiles;

-- Ensure the restrictive anonymous blocking policy exists
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;
CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public, anon
USING (false)
WITH CHECK (false);

-- Ensure users can ONLY view their own profile (no other users' profiles)
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_user_session() 
  AND user_status = 'active'
);

-- Ensure users can ONLY update their own profile
DROP POLICY IF EXISTS "Users can update own profile with validation" ON public.profiles;
CREATE POLICY "Users can update own profile with validation"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND validate_user_session() 
  AND user_status = 'active' 
  AND enhanced_security_rate_limit('profile_update', 10, 60)
)
WITH CHECK (
  auth.uid() = user_id 
  AND validate_user_session() 
  AND user_status = 'active'
);

-- Ensure users CANNOT delete their own profiles (admin only)
DROP POLICY IF EXISTS "Users cannot delete profiles" ON public.profiles;
CREATE POLICY "Users cannot delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- Admin policies remain with strict validation
DROP POLICY IF EXISTS "Admins can view all profiles with validation" ON public.profiles;
CREATE POLICY "Admins can view all profiles with validation"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session() 
  AND enhanced_security_rate_limit('admin_profile_access', 100, 5)
);

DROP POLICY IF EXISTS "Admins can manage profiles with validation" ON public.profiles;
CREATE POLICY "Admins can manage profiles with validation"
ON public.profiles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session() 
  AND enhanced_security_rate_limit('admin_profile_manage', 50, 5)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND validate_user_session()
);

-- System can create profiles during registration (service_role only)
DROP POLICY IF EXISTS "System can create profiles during registration" ON public.profiles;
CREATE POLICY "System can create profiles during registration"
ON public.profiles
FOR INSERT
TO authenticated, service_role
WITH CHECK (
  current_setting('role') = 'service_role' 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Log the security fix
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'critical_security_fix_profiles_rls',
  jsonb_build_object(
    'table', 'profiles',
    'issue', 'overly_permissive_policy_removed',
    'fix', 'strict_user_scoped_policies_enforced',
    'severity', 'critical',
    'timestamp', now(),
    'policies_updated', jsonb_build_array(
      'Block all anonymous access (RESTRICTIVE)',
      'Users can only view own profile',
      'Users can only update own profile',
      'Users cannot delete profiles',
      'Admin access with strict validation'
    )
  ),
  inet_client_addr()
);

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;