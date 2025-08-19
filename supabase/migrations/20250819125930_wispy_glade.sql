/*
  # Create Quick Send Tables

  1. New Tables
    - `quick_send_jobs`
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key)
      - `created_by` (uuid, foreign key)
      - `message` (text)
      - `sender_id` (text)
      - `total_recipients` (integer)
      - `segments_avg` (integer)
      - `credits_estimated` (integer)
      - `credits_spent` (integer)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `completed_at` (timestamp)
    
    - `quick_send_targets`
      - `id` (uuid, primary key)
      - `job_id` (uuid, foreign key)
      - `phone_e164` (text)
      - `rendered_message` (text)
      - `segments` (integer)
      - `status` (text)
      - `bulksms_message_id` (text)
      - `error_code` (text)
      - `error_detail` (text)
      - `sent_at` (timestamp)
      - `delivered_at` (timestamp)
      - `created_at` (timestamp)
      - `contact_id` (uuid, optional foreign key)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to access their own data
    - Add policies for admins to access all data
*/

-- Create quick_send_jobs table
CREATE TABLE IF NOT EXISTS public.quick_send_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  created_by UUID NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT DEFAULT 'SMSAO',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  segments_avg INTEGER NOT NULL DEFAULT 1,
  credits_estimated INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create quick_send_targets table
CREATE TABLE IF NOT EXISTS public.quick_send_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.quick_send_jobs(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  rendered_message TEXT NOT NULL,
  segments INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed')),
  bulksms_message_id TEXT,
  error_code TEXT,
  error_detail TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  contact_id UUID -- Optional reference to contacts table
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quick_send_jobs_account ON public.quick_send_jobs(account_id);
CREATE INDEX IF NOT EXISTS idx_quick_send_jobs_status ON public.quick_send_jobs(status);
CREATE INDEX IF NOT EXISTS idx_quick_send_targets_job ON public.quick_send_targets(job_id);
CREATE INDEX IF NOT EXISTS idx_quick_send_targets_status ON public.quick_send_targets(status);
CREATE INDEX IF NOT EXISTS idx_quick_send_targets_bulksms ON public.quick_send_targets(bulksms_message_id);

-- Enable RLS
ALTER TABLE public.quick_send_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_send_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_send_jobs
CREATE POLICY "Users can manage own quick send jobs" 
ON public.quick_send_jobs 
FOR ALL 
USING (account_id = public.get_current_account_id());

CREATE POLICY "Admins can manage all quick send jobs" 
ON public.quick_send_jobs 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for quick_send_targets
CREATE POLICY "Users can view own quick send targets" 
ON public.quick_send_targets 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.quick_send_jobs j 
  WHERE j.id = job_id AND j.account_id = public.get_current_account_id()
));

CREATE POLICY "System can manage quick send targets" 
ON public.quick_send_targets 
FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all quick send targets" 
ON public.quick_send_targets 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on quick_send_jobs
CREATE TRIGGER update_quick_send_jobs_updated_at
  BEFORE UPDATE ON public.quick_send_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();