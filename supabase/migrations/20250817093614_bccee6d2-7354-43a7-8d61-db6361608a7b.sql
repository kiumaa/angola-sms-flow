-- Add missing columns to sms_logs table for webhook functionality
ALTER TABLE public.sms_logs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS payload JSONB,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_sms_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_sms_logs_updated_at_trigger ON public.sms_logs;
CREATE TRIGGER update_sms_logs_updated_at_trigger
  BEFORE UPDATE ON public.sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sms_logs_updated_at();

-- Create indexes for better webhook performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_gateway_message_id ON public.sms_logs (gateway_message_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_completed_at ON public.sms_logs (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status_updated ON public.sms_logs (status, updated_at DESC);