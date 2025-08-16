-- Enable RLS on otp_requests table and create restrictive policies
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all OTP requests" ON public.otp_requests;
DROP POLICY IF EXISTS "Users can create OTP requests" ON public.otp_requests;
DROP POLICY IF EXISTS "Users can update their own OTP requests" ON public.otp_requests;
DROP POLICY IF EXISTS "Users can view their own OTP requests" ON public.otp_requests;

-- Create restrictive policies that deny everything for authenticated/anon users
-- Only service role can access (for backend operations)
CREATE POLICY "otp_no_select" ON public.otp_requests 
FOR SELECT TO authenticated USING (false);

CREATE POLICY "otp_no_insert" ON public.otp_requests 
FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "otp_no_update" ON public.otp_requests 
FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "otp_no_delete" ON public.otp_requests 
FOR DELETE TO authenticated USING (false);

-- Same for anon users
CREATE POLICY "otp_no_select_anon" ON public.otp_requests 
FOR SELECT TO anon USING (false);

CREATE POLICY "otp_no_insert_anon" ON public.otp_requests 
FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "otp_no_update_anon" ON public.otp_requests 
FOR UPDATE TO anon USING (false) WITH CHECK (false);

CREATE POLICY "otp_no_delete_anon" ON public.otp_requests 
FOR DELETE TO anon USING (false);

-- Update otp_requests table structure for security
-- Change code column to store hash instead of plain text
ALTER TABLE public.otp_requests 
ALTER COLUMN code TYPE TEXT;

-- Add columns for rate limiting
ALTER TABLE public.otp_requests 
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ip_address INET;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_otp_requests_phone_created 
ON public.otp_requests (phone, created_at);

-- Create function to cleanup expired/used OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.otp_requests 
  WHERE (expires_at < now() OR used = true)
  AND created_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the expiry time to 5 minutes (override the existing trigger)
CREATE OR REPLACE FUNCTION public.set_otp_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at THEN
    NEW.expires_at = NEW.created_at + INTERVAL '5 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';