-- Create quick send jobs table
CREATE TABLE public.quick_send_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL,
  created_by UUID NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT NOT NULL DEFAULT 'SMSAO',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  segments_avg NUMERIC NOT NULL DEFAULT 1,
  credits_estimated INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quick send targets table
CREATE TABLE public.quick_send_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.quick_send_jobs(id) ON DELETE CASCADE,
  contact_id UUID,
  phone_e164 TEXT NOT NULL,
  rendered_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed')),
  segments INTEGER NOT NULL DEFAULT 1,
  bulksms_message_id TEXT,
  error_code TEXT,
  error_detail TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.quick_send_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_send_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies for quick_send_jobs
CREATE POLICY "Users can manage own quick send jobs" 
ON public.quick_send_jobs 
FOR ALL 
USING (account_id = get_current_account_id());

CREATE POLICY "Admins can manage all quick send jobs" 
ON public.quick_send_jobs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for quick_send_targets
CREATE POLICY "Users can manage own quick send targets" 
ON public.quick_send_targets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.quick_send_jobs 
    WHERE id = quick_send_targets.job_id 
    AND account_id = get_current_account_id()
  )
);

CREATE POLICY "Admins can manage all quick send targets" 
ON public.quick_send_targets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert/update targets during processing
CREATE POLICY "System can update quick send targets" 
ON public.quick_send_targets 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_quick_send_jobs_account_id ON public.quick_send_jobs(account_id);
CREATE INDEX idx_quick_send_jobs_status ON public.quick_send_jobs(status);
CREATE INDEX idx_quick_send_targets_job_id ON public.quick_send_targets(job_id);
CREATE INDEX idx_quick_send_targets_status ON public.quick_send_targets(status);
CREATE INDEX idx_quick_send_targets_bulksms_id ON public.quick_send_targets(bulksms_message_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_quick_send_jobs_updated_at
  BEFORE UPDATE ON public.quick_send_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add feature flag for campaigns
INSERT INTO public.site_settings (key, value, description)
VALUES ('FEATURE_CAMPAIGNS', 'false', 'Enable/disable campaigns feature')
ON CONFLICT (key) DO UPDATE SET value = 'false', description = 'Enable/disable campaigns feature';