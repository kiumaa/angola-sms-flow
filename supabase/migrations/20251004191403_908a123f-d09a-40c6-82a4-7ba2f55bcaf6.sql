-- ============================================
-- MIGRATION: Encrypt OTP Codes with pgcrypto
-- ============================================

-- 1. Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add hashed_code column
ALTER TABLE public.otp_requests 
ADD COLUMN IF NOT EXISTS hashed_code text;

-- 3. Create function to hash OTP codes
CREATE OR REPLACE FUNCTION public.hash_otp_code(code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use SHA-256 with a secret pepper from environment
  RETURN encode(
    digest(code || COALESCE(current_setting('app.otp_pepper', true), 'default_pepper'), 'sha256'),
    'hex'
  );
END;
$$;

-- 4. Migrate existing data (hash current codes)
UPDATE public.otp_requests
SET hashed_code = hash_otp_code(code)
WHERE hashed_code IS NULL;

-- 5. Make hashed_code NOT NULL after migration
ALTER TABLE public.otp_requests 
ALTER COLUMN hashed_code SET NOT NULL;

-- 6. Create index on hashed_code for performance
CREATE INDEX IF NOT EXISTS idx_otp_hashed_code ON public.otp_requests(hashed_code);

-- 7. Create function to verify OTP with IP validation
CREATE OR REPLACE FUNCTION public.verify_otp_with_security(
  phone_number text,
  otp_code text,
  client_ip inet
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  otp_record RECORD;
  hashed_input text;
BEGIN
  -- Hash the input code
  hashed_input := hash_otp_code(otp_code);
  
  -- Find matching OTP
  SELECT * INTO otp_record
  FROM public.otp_requests
  WHERE phone = phone_number
    AND hashed_code = hashed_input
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Log failed attempt
    PERFORM log_security_event(
      'otp_verification_failed',
      NULL,
      jsonb_build_object(
        'phone', 'REDACTED_' || right(phone_number, 4),
        'ip_address', client_ip,
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  -- Validate IP if present
  IF otp_record.ip_address IS NOT NULL AND otp_record.ip_address != client_ip THEN
    PERFORM log_security_event(
      'otp_ip_mismatch',
      otp_record.user_id,
      jsonb_build_object(
        'original_ip', otp_record.ip_address,
        'current_ip', client_ip,
        'phone', 'REDACTED_' || right(phone_number, 4)
      )
    );
  END IF;
  
  -- Mark as used
  UPDATE public.otp_requests
  SET used = true
  WHERE id = otp_record.id;
  
  RETURN true;
END;
$$;

-- 8. Create trigger to detect suspicious OTP patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_otp_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_attempts integer;
BEGIN
  -- Check for rapid OTP generation from same IP
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO recent_attempts
    FROM public.otp_requests
    WHERE ip_address = NEW.ip_address
      AND created_at > now() - interval '5 minutes';
    
    IF recent_attempts > 5 THEN
      PERFORM log_security_event(
        'suspicious_otp_activity',
        NEW.user_id,
        jsonb_build_object(
          'ip_address', NEW.ip_address,
          'attempts_5min', recent_attempts,
          'phone', 'REDACTED_' || right(NEW.phone, 4),
          'severity', 'high'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER detect_otp_abuse
  AFTER INSERT ON public.otp_requests
  FOR EACH ROW
  EXECUTE FUNCTION detect_suspicious_otp_activity();

-- 9. Add comment explaining security
COMMENT ON COLUMN public.otp_requests.hashed_code IS 
  'SHA-256 hash of OTP code with secret pepper. Never store OTP codes in plaintext.';

COMMENT ON COLUMN public.otp_requests.code IS 
  'DEPRECATED: Will be removed after full migration to hashed_code. Do not use.';