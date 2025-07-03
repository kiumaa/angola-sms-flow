-- Add email confirmation and credit request systems

-- Add email confirmation token to profiles
ALTER TABLE public.profiles 
ADD COLUMN email_confirmed BOOLEAN DEFAULT false,
ADD COLUMN email_confirm_token TEXT DEFAULT NULL,
ADD COLUMN email_confirm_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create credit_requests table for admin approval system
CREATE TABLE public.credit_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id),
  amount_kwanza NUMERIC NOT NULL,
  credits_requested INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  receipt_url TEXT,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credit_requests
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_requests
CREATE POLICY "Users can view own credit requests" ON public.credit_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own credit requests" ON public.credit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit requests" ON public.credit_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_credit_requests_updated_at
  BEFORE UPDATE ON public.credit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to approve credit request and add credits
CREATE OR REPLACE FUNCTION public.approve_credit_request(request_id UUID, admin_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM public.credit_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE public.credit_requests 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = admin_user_id,
    updated_at = now()
  WHERE id = request_id;
  
  -- Add credits to user profile
  PERFORM public.add_user_credits(request_record.user_id, request_record.credits_requested);
  
  RETURN TRUE;
END;
$$;

-- Function to reject credit request
CREATE OR REPLACE FUNCTION public.reject_credit_request(request_id UUID, admin_user_id UUID, notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.credit_requests 
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = admin_user_id,
    admin_notes = notes,
    updated_at = now()
  WHERE id = request_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$;