-- OTP Infrastructure Rollback Migration
-- Use this script to completely remove OTP functionality if needed

-- Drop the trigger first (depends on function)
DROP TRIGGER IF EXISTS set_otp_expiration_trigger ON public.otp_requests;

-- Drop the functions
DROP FUNCTION IF EXISTS public.set_otp_expiration();
DROP FUNCTION IF EXISTS public.clean_expired_otps();

-- Drop all indexes
DROP INDEX IF EXISTS idx_otp_requests_phone;
DROP INDEX IF EXISTS idx_otp_requests_expires_at;
DROP INDEX IF EXISTS idx_otp_requests_user_id;

-- Drop the table (this will also drop all policies automatically)
DROP TABLE IF EXISTS public.otp_requests;

-- Note: RLS policies are automatically dropped when the table is dropped
-- No need to explicitly drop policies

-- Verification queries (run these after rollback to confirm cleanup):
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'otp_requests';
-- SELECT proname FROM pg_proc WHERE proname IN ('set_otp_expiration', 'clean_expired_otps');
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%otp_requests%';