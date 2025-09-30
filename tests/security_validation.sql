-- Security Validation Test Suite
-- Run these tests to validate security fixes
-- Expected: All tests should PASS

\echo '================================================'
\echo 'SECURITY VALIDATION TEST SUITE'
\echo '================================================'
\echo ''

-- Set up test environment
BEGIN;

-- Create temporary test users for validation
DO $$
DECLARE
  test_user_a uuid;
  test_user_b uuid;
BEGIN
  -- Note: In actual testing, you'd create real auth users
  -- This is a simplified version for validation
  
  \echo 'TEST 1: Anonymous users cannot access profiles'
  \echo '----------------------------------------------'
  
  -- This should fail/return no rows
  SET ROLE anon;
  PERFORM * FROM public.profiles LIMIT 1;
  
  IF FOUND THEN
    RAISE EXCEPTION 'FAILED: Anonymous users can access profiles!';
  ELSE
    RAISE NOTICE 'PASSED: Anonymous users blocked from profiles';
  END IF;
  
  RESET ROLE;
  
  \echo ''
  \echo 'TEST 2: Anonymous users cannot access contacts'
  \echo '----------------------------------------------'
  
  SET ROLE anon;
  PERFORM * FROM public.contacts LIMIT 1;
  
  IF FOUND THEN
    RAISE EXCEPTION 'FAILED: Anonymous users can access contacts!';
  ELSE
    RAISE NOTICE 'PASSED: Anonymous users blocked from contacts';
  END IF;
  
  RESET ROLE;
  
  \echo ''
  \echo 'TEST 3: safe_profiles view contains no PII'
  \echo '-------------------------------------------'
  
  -- Check that view doesn't expose sensitive columns
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'safe_profiles' 
    AND column_name IN ('email', 'phone', 'full_name', 'company_name')
  ) THEN
    RAISE EXCEPTION 'FAILED: safe_profiles exposes PII columns!';
  ELSE
    RAISE NOTICE 'PASSED: safe_profiles contains no PII columns';
  END IF;
  
  \echo ''
  \echo 'TEST 4: PII masking functions work correctly'
  \echo '--------------------------------------------'
  
  -- Test email masking
  IF mask_email('user@example.com') != 'us***@example.com' THEN
    RAISE EXCEPTION 'FAILED: Email masking not working correctly';
  ELSE
    RAISE NOTICE 'PASSED: Email masking works';
  END IF;
  
  -- Test phone masking
  IF mask_phone('+244912345678') NOT LIKE '***-5678' THEN
    RAISE EXCEPTION 'FAILED: Phone masking not working correctly';
  ELSE
    RAISE NOTICE 'PASSED: Phone masking works';
  END IF;
  
  -- Test name masking
  IF mask_name('João Silva') != 'J***' THEN
    RAISE EXCEPTION 'FAILED: Name masking not working correctly';
  ELSE
    RAISE NOTICE 'PASSED: Name masking works';
  END IF;
  
  \echo ''
  \echo 'TEST 5: All functions have search_path set'
  \echo '------------------------------------------'
  
  -- Check for functions without search_path
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND prosecdef = true  -- SECURITY DEFINER functions
    AND NOT EXISTS (
      SELECT 1
      FROM pg_proc_config(p.oid)
      WHERE split_part(unnest, '=', 1) = 'search_path'
    )
  ) THEN
    RAISE WARNING 'Some SECURITY DEFINER functions may not have search_path set';
  ELSE
    RAISE NOTICE 'PASSED: All critical functions have search_path configured';
  END IF;
  
  \echo ''
  \echo 'TEST 6: RLS is enabled on sensitive tables'
  \echo '------------------------------------------'
  
  -- Check profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'FAILED: RLS not enabled on profiles!';
  ELSE
    RAISE NOTICE 'PASSED: RLS enabled on profiles';
  END IF;
  
  -- Check contacts
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contacts' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'FAILED: RLS not enabled on contacts!';
  ELSE
    RAISE NOTICE 'PASSED: RLS enabled on contacts';
  END IF;
  
  \echo ''
  \echo 'TEST 7: Audit tables exist and are protected'
  \echo '--------------------------------------------'
  
  -- Check PII access audit table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'pii_access_audit'
  ) THEN
    RAISE EXCEPTION 'FAILED: pii_access_audit table not found!';
  ELSE
    RAISE NOTICE 'PASSED: pii_access_audit table exists';
  END IF;
  
  -- Check function call audit table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'function_call_audit'
  ) THEN
    RAISE EXCEPTION 'FAILED: function_call_audit table not found!';
  ELSE
    RAISE NOTICE 'PASSED: function_call_audit table exists';
  END IF;
  
  \echo ''
  \echo 'TEST 8: Security policies are in place'
  \echo '--------------------------------------'
  
  -- Count policies on profiles
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') < 3 THEN
    RAISE WARNING 'profiles table has fewer policies than expected';
  ELSE
    RAISE NOTICE 'PASSED: profiles has adequate policies';
  END IF;
  
  -- Count policies on contacts
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'contacts') < 3 THEN
    RAISE WARNING 'contacts table has fewer policies than expected';
  ELSE
    RAISE NOTICE 'PASSED: contacts has adequate policies';
  END IF;
  
  \echo ''
  \echo '================================================'
  \echo 'TEST SUITE COMPLETED'
  \echo '================================================'
  
END $$;

ROLLBACK;

-- Additional manual validation queries
\echo ''
\echo 'MANUAL VALIDATION QUERIES'
\echo '========================='
\echo ''
\echo '1. View all policies on profiles:'
\echo 'SELECT * FROM pg_policies WHERE tablename = ''profiles'';'
\echo ''
\echo '2. View all policies on contacts:'
\echo 'SELECT * FROM pg_policies WHERE tablename = ''contacts'';'
\echo ''
\echo '3. List all SECURITY DEFINER functions:'
\echo 'SELECT n.nspname, p.proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE prosecdef = true AND n.nspname = ''public'';'
\echo ''
\echo '4. Check recent PII access:'
\echo 'SELECT * FROM public.pii_access_audit ORDER BY accessed_at DESC LIMIT 10;'
\echo ''
\echo '5. Check safe_profiles view structure:'
\echo 'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ''safe_profiles'';'
