-- Phase 1: Critical Security Fixes - Part 1
-- Drop existing function and recreate with correct signature

-- Drop existing SMTP functions
DROP FUNCTION IF EXISTS public.get_smtp_settings_for_admin();
DROP FUNCTION IF EXISTS public.get_smtp_settings_for_edge_function();

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- PART 1: SMTP Password Encryption Functions
-- ============================================

-- Function to encrypt SMTP password using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a secret key from environment or generate one
  encryption_key := COALESCE(
    current_setting('app.smtp_encryption_key', true),
    encode(gen_random_bytes(32), 'hex')
  );
  
  -- Encrypt using AES-256
  RETURN encode(
    encrypt(
      password_text::bytea,
      encryption_key::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;

-- Function to decrypt SMTP password (only for edge functions)
CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(encrypted_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Only allow service role to decrypt
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can decrypt SMTP passwords';
  END IF;
  
  encryption_key := COALESCE(
    current_setting('app.smtp_encryption_key', true),
    encode(gen_random_bytes(32), 'hex')
  );
  
  RETURN convert_from(
    decrypt(
      decode(encrypted_password, 'base64'),
      encryption_key::bytea,
      'aes'
    ),
    'UTF8'
  );
END;
$$;

-- Secure function to get SMTP settings for admin (with masked password)
CREATE OR REPLACE FUNCTION public.get_smtp_settings_for_admin()
RETURNS TABLE (
  id uuid,
  host text,
  port integer,
  username text,
  from_name text,
  from_email text,
  use_tls boolean,
  is_active boolean,
  test_status text,
  last_tested_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access SMTP settings';
  END IF;
  
  -- Rate limit check
  IF NOT enhanced_security_rate_limit('smtp_settings_access', 20, 5) THEN
    RAISE EXCEPTION 'Rate limit exceeded for SMTP settings access';
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.host,
    s.port,
    s.username,
    s.from_name,
    s.from_email,
    s.use_tls,
    s.is_active,
    s.test_status,
    s.last_tested_at
  FROM public.smtp_settings s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;

-- Secure function to get SMTP settings for edge functions (with decrypted password)
CREATE OR REPLACE FUNCTION public.get_smtp_settings_for_edge_function()
RETURNS TABLE (
  id uuid,
  host text,
  port integer,
  username text,
  password text,
  from_name text,
  from_email text,
  use_tls boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  settings_record record;
BEGIN
  -- Only service role can access
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can access SMTP credentials';
  END IF;
  
  SELECT * INTO settings_record
  FROM public.smtp_settings
  WHERE is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active SMTP configuration found';
  END IF;
  
  RETURN QUERY
  SELECT 
    settings_record.id,
    settings_record.host,
    settings_record.port,
    settings_record.username,
    decrypt_smtp_password(settings_record.password_encrypted) as password,
    settings_record.from_name,
    settings_record.from_email,
    settings_record.use_tls;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_smtp_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_smtp_settings_for_admin() TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.encrypt_smtp_password(text) IS 'Encrypts SMTP password using AES-256 encryption';
COMMENT ON FUNCTION public.decrypt_smtp_password(text) IS 'Decrypts SMTP password - SERVICE ROLE ONLY';
COMMENT ON FUNCTION public.get_smtp_settings_for_admin() IS 'Returns SMTP settings with masked password for admin UI';
COMMENT ON FUNCTION public.get_smtp_settings_for_edge_function() IS 'Returns SMTP settings with decrypted password for edge functions';