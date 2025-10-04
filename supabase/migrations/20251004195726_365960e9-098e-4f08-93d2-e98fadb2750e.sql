-- Phase 1: Critical Security Fix - Service Role Policy Hardening
-- Removes overly permissive policies and adds granular audited access

-- Step 1: Drop ONLY the overly permissive policies
DROP POLICY IF EXISTS "Service role can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage contacts for imports" ON public.contacts;

-- Step 2: Create new contacts policy (profiles policies already exist)
CREATE POLICY "Service role can insert contacts for imports"
ON public.contacts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 3: Add audit triggers for all service role operations
DROP TRIGGER IF EXISTS audit_service_role_profiles ON public.profiles;
CREATE TRIGGER audit_service_role_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_service_role_access();

DROP TRIGGER IF EXISTS audit_service_role_contacts ON public.contacts;
CREATE TRIGGER audit_service_role_contacts
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit_service_role_access();

DROP TRIGGER IF EXISTS audit_service_role_otp ON public.otp_requests;
CREATE TRIGGER audit_service_role_otp
  AFTER INSERT OR UPDATE OR DELETE ON public.otp_requests
  FOR EACH ROW
  EXECUTE FUNCTION audit_service_role_access();

-- Step 4: Drop the plain text code column from otp_requests (security critical)
ALTER TABLE public.otp_requests DROP COLUMN IF EXISTS code;

-- Step 5: Add NOT NULL constraint to hashed_code to prevent bypasses
ALTER TABLE public.otp_requests 
ALTER COLUMN hashed_code SET NOT NULL;