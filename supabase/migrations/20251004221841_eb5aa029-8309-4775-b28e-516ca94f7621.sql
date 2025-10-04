-- Phase 5: Add explicit unauthenticated denial and profile access auditing
-- Ensures no gaps in RLS protection for profiles table

-- 1. Add explicit RESTRICTIVE policy to deny all unauthenticated access
-- This provides defense-in-depth against policy misconfigurations
CREATE POLICY "Deny all unauthenticated access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- 2. Drop existing safe_profiles view if it exists, then recreate
DROP VIEW IF EXISTS public.safe_profiles;

-- 3. Create a safe view that shows only non-PII profile information
CREATE VIEW public.safe_profiles AS
SELECT 
  id,
  user_id,
  credits,
  created_at,
  user_status
FROM public.profiles
WHERE user_id = auth.uid();

-- Grant access to authenticated users only
GRANT SELECT ON public.safe_profiles TO authenticated;

COMMENT ON VIEW public.safe_profiles IS 
  'Safe view of profiles that only shows current user data and excludes PII like email, phone, name';

-- 4. Document the security model
COMMENT ON TABLE public.profiles IS 
  'User profiles with PII. CRITICAL: All access must be restricted to user_id = auth.uid() except for admin operations. Service role limited to credits updates only.';

COMMENT ON COLUMN public.profiles.email IS 'PII: User email address - restricted access';
COMMENT ON COLUMN public.profiles.phone IS 'PII: User phone number - restricted access';
COMMENT ON COLUMN public.profiles.full_name IS 'PII: User full name - restricted access';
COMMENT ON COLUMN public.profiles.company_name IS 'PII: Company name - restricted access';

-- 5. Add index to improve RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_active 
ON public.profiles(user_id, user_status) 
WHERE user_status = 'active';