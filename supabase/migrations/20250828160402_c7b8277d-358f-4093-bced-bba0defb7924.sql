-- Fix OTP expiration function for better security
CREATE OR REPLACE FUNCTION public.set_otp_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at THEN
    NEW.expires_at = NEW.created_at + INTERVAL '5 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Improve function search path security
CREATE OR REPLACE FUNCTION public.clean_expired_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.otp_requests 
  WHERE expires_at < now() AND used = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Enhance cleanup function with more efficient logic
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.otp_requests 
  WHERE (expires_at < now() OR used = true)
  AND created_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;