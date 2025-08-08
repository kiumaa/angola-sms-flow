-- Fix security warnings: Update functions with proper search_path

-- Update the OTP expiration function with proper security settings
CREATE OR REPLACE FUNCTION public.set_otp_expiration()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at THEN
    NEW.expires_at = NEW.created_at + INTERVAL '5 minutes';
  END IF;
  RETURN NEW;
END;
$$;

-- Update the cleanup function with proper security settings
CREATE OR REPLACE FUNCTION public.clean_expired_otps()
RETURNS INTEGER 
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