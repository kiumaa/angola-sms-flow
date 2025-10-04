-- Phase 1: Critical Security Fixes - Part 2
-- PII Encryption and Automatic Data Cleanup Functions

-- ============================================
-- PART 2: PII Encryption Functions
-- ============================================

-- Generic encryption function for PII fields
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use secret key from environment
  encryption_key := COALESCE(
    current_setting('app.pii_encryption_key', true),
    encode(gen_random_bytes(32), 'hex')
  );
  
  RETURN encode(
    encrypt(
      plaintext::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;

-- Generic decryption function for PII fields
CREATE OR REPLACE FUNCTION public.decrypt_pii(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Only allow authenticated users to decrypt their own data or admins
  IF auth.uid() IS NULL AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Must be authenticated to decrypt PII';
  END IF;
  
  encryption_key := COALESCE(
    current_setting('app.pii_encryption_key', true),
    encode(gen_random_bytes(32), 'hex')
  );
  
  RETURN convert_from(
    decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return NULL instead of exposing error
    RETURN NULL;
END;
$$;

-- ============================================
-- PART 3: Automatic Data Cleanup Functions
-- ============================================

-- Enhanced cleanup function for expired OTPs (called hourly)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete OTPs older than 2 hours or already used
  DELETE FROM public.otp_requests
  WHERE created_at < now() - interval '2 hours'
     OR (expires_at < now() AND used = true);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup action
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'automated_otp_cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'timestamp', now(),
      'cleanup_type', 'hourly_scheduled'
    ),
    inet '127.0.0.1'
  );
  
  RETURN deleted_count;
END;
$$;

-- Cleanup old campaign data (called daily)
CREATE OR REPLACE FUNCTION public.cleanup_old_campaigns()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer := 0;
  temp_count integer;
BEGIN
  -- Delete completed campaigns older than 90 days
  DELETE FROM public.campaign_targets
  WHERE status IN ('delivered', 'failed', 'undeliverable')
    AND delivered_at < now() - interval '90 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete draft campaigns older than 30 days
  DELETE FROM public.campaigns
  WHERE status = 'draft'
    AND created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Log cleanup
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'automated_campaign_cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'timestamp', now()
    ),
    inet '127.0.0.1'
  );
  
  RETURN deleted_count;
END;
$$;

-- Cleanup old SMS logs (called weekly)
CREATE OR REPLACE FUNCTION public.cleanup_old_sms_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Keep SMS logs for 180 days (6 months)
  DELETE FROM public.sms_logs
  WHERE created_at < now() - interval '180 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'automated_sms_logs_cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'timestamp', now()
    ),
    inet '127.0.0.1'
  );
  
  RETURN deleted_count;
END;
$$;

-- Cleanup expired LGPD requests (called daily)
CREATE OR REPLACE FUNCTION public.cleanup_expired_lgpd_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete processed LGPD requests older than the retention period (expires_at)
  DELETE FROM public.lgpd_requests
  WHERE status IN ('completed', 'rejected')
    AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'automated_lgpd_cleanup',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'timestamp', now()
    ),
    inet '127.0.0.1'
  );
  
  RETURN deleted_count;
END;
$$;

-- Master cleanup function that runs all cleanup tasks
CREATE OR REPLACE FUNCTION public.run_all_cleanup_tasks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  otp_deleted integer;
  campaign_deleted integer;
  sms_deleted integer;
  lgpd_deleted integer;
BEGIN
  -- Run all cleanup functions
  otp_deleted := cleanup_expired_otps();
  campaign_deleted := cleanup_old_campaigns();
  sms_deleted := cleanup_old_sms_logs();
  lgpd_deleted := cleanup_expired_lgpd_requests();
  
  result := jsonb_build_object(
    'timestamp', now(),
    'total_deleted', otp_deleted + campaign_deleted + sms_deleted + lgpd_deleted,
    'details', jsonb_build_object(
      'otp_requests', otp_deleted,
      'campaigns', campaign_deleted,
      'sms_logs', sms_deleted,
      'lgpd_requests', lgpd_deleted
    )
  );
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_pii(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_pii(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_campaigns() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_sms_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_lgpd_requests() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_all_cleanup_tasks() TO service_role;

-- Add comments
COMMENT ON FUNCTION public.encrypt_pii(text) IS 'Encrypts PII data using AES-256';
COMMENT ON FUNCTION public.decrypt_pii(text) IS 'Decrypts PII data - authenticated users only';
COMMENT ON FUNCTION public.cleanup_expired_otps() IS 'Removes expired OTP requests - runs hourly';
COMMENT ON FUNCTION public.cleanup_old_campaigns() IS 'Removes old campaign data - runs daily';
COMMENT ON FUNCTION public.cleanup_old_sms_logs() IS 'Removes old SMS logs - runs weekly';
COMMENT ON FUNCTION public.cleanup_expired_lgpd_requests() IS 'Removes expired LGPD requests - runs daily';
COMMENT ON FUNCTION public.run_all_cleanup_tasks() IS 'Master function to run all cleanup tasks';