-- Create SMTP settings table
CREATE TABLE public.smtp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 587,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  use_tls BOOLEAN NOT NULL DEFAULT true,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'pending'))
);

-- Create SMTP test logs table
CREATE TABLE public.smtp_test_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  response_time_ms INTEGER,
  tested_by UUID REFERENCES auth.users(id),
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_test_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for smtp_settings
CREATE POLICY "Only admins can manage SMTP settings" 
ON public.smtp_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create policies for smtp_test_logs
CREATE POLICY "Only admins can view SMTP test logs" 
ON public.smtp_test_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates on smtp_settings
CREATE TRIGGER update_smtp_settings_updated_at
BEFORE UPDATE ON public.smtp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to encrypt/decrypt passwords (simple implementation)
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple base64 encoding for now (in production, use proper encryption)
  RETURN encode(password_text::bytea, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(encrypted_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple base64 decoding for now (in production, use proper decryption)
  RETURN convert_from(decode(encrypted_password, 'base64'), 'UTF8');
END;
$$;