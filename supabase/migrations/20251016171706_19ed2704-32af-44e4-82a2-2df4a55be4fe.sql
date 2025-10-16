-- Drop existing policies on quick_send_jobs if they exist
DROP POLICY IF EXISTS "Users can manage own quick send jobs" ON public.quick_send_jobs;
DROP POLICY IF EXISTS "Admins can manage all quick send jobs" ON public.quick_send_jobs;

-- Create quick_send_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quick_send_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  message TEXT NOT NULL,
  sender_id TEXT NOT NULL DEFAULT 'SMSAO',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  segments_avg NUMERIC NOT NULL DEFAULT 1,
  credits_estimated INTEGER NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.quick_send_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_send_jobs
CREATE POLICY "Users can manage own quick send jobs"
  ON public.quick_send_jobs
  FOR ALL
  USING (account_id = get_current_account_id());

CREATE POLICY "Admins can manage all quick send jobs"
  ON public.quick_send_jobs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at if not exists
DROP TRIGGER IF EXISTS update_quick_send_jobs_updated_at ON public.quick_send_jobs;
CREATE TRIGGER update_quick_send_jobs_updated_at
  BEFORE UPDATE ON public.quick_send_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create or replace debit_user_credits function with account_id support
CREATE OR REPLACE FUNCTION public.debit_user_credits(
  _user_id UUID,
  _account_id UUID,
  _credits INTEGER,
  _reference TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
  transaction_id UUID;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = _account_id AND user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Account not found'
    );
  END IF;

  -- Check if user has enough credits
  IF current_credits < _credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_credits', current_credits,
      'required_credits', _credits
    );
  END IF;

  -- Debit credits
  new_credits := current_credits - _credits;
  
  UPDATE public.profiles
  SET 
    credits = new_credits,
    updated_at = now()
  WHERE id = _account_id AND user_id = _user_id;

  -- Log the transaction
  INSERT INTO public.sms_logs (
    user_id,
    account_id,
    phone,
    message,
    status,
    cost_credits,
    gateway,
    created_at
  ) VALUES (
    _user_id,
    _account_id,
    _reference,
    'Credit debit: ' || _credits || ' credits',
    'completed',
    _credits,
    'system',
    now()
  )
  RETURNING id INTO transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', current_credits,
    'debited_credits', _credits,
    'new_credits', new_credits,
    'transaction_id', transaction_id
  );
END;
$$;