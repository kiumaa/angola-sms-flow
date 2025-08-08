-- Create OTP requests table
CREATE TABLE public.otp_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code CHAR(6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP requests
CREATE POLICY "Users can view their own OTP requests" 
ON public.otp_requests 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create OTP requests" 
ON public.otp_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own OTP requests" 
ON public.otp_requests 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all OTP requests" 
ON public.otp_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance on phone and expiration queries
CREATE INDEX idx_otp_requests_phone ON public.otp_requests(phone);
CREATE INDEX idx_otp_requests_expires_at ON public.otp_requests(expires_at);
CREATE INDEX idx_otp_requests_user_id ON public.otp_requests(user_id);

-- Create function to automatically set expires_at
CREATE OR REPLACE FUNCTION public.set_otp_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at THEN
    NEW.expires_at = NEW.created_at + INTERVAL '5 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expiration
CREATE TRIGGER set_otp_expiration_trigger
  BEFORE INSERT OR UPDATE ON public.otp_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_otp_expiration();

-- Create function to clean expired OTP codes (optional utility)
CREATE OR REPLACE FUNCTION public.clean_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.otp_requests 
  WHERE expires_at < now() AND used = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;