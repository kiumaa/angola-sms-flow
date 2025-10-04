-- Phase 5b: Fix safe_profiles view to use SECURITY INVOKER
-- This ensures the view respects RLS policies of the querying user

-- Drop and recreate the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles
WITH (security_invoker=on)
AS
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
  'Safe view of profiles with SECURITY INVOKER enabled - respects RLS policies and only shows current user non-PII data';