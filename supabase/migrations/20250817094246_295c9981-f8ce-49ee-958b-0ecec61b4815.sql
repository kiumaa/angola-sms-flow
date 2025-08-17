-- Fix search_path security issue for cleanup_expired_otps function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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