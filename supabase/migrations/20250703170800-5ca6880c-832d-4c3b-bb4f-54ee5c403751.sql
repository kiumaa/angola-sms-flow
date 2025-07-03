-- Create credit adjustments table for tracking credit changes
CREATE TABLE public.credit_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  admin_id UUID NOT NULL REFERENCES profiles(user_id),
  delta INTEGER NOT NULL, -- Positive or negative
  reason TEXT NOT NULL,
  previous_balance INTEGER NOT NULL,
  new_balance INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('manual', 'purchase', 'bonus', 'refund')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(user_id),
  action TEXT NOT NULL, -- 'create_user', 'edit_user', 'delete_user', 'adjust_credits'
  target_user_id UUID REFERENCES profiles(user_id),
  details JSONB, -- Action specific data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.credit_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_adjustments
CREATE POLICY "Only admins can manage credit adjustments" 
ON public.credit_adjustments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create policies for admin_audit_logs
CREATE POLICY "Only admins can view audit logs" 
ON public.admin_audit_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add user status column to profiles for soft delete
ALTER TABLE public.profiles 
ADD COLUMN user_status TEXT DEFAULT 'active' CHECK (user_status IN ('active', 'inactive', 'suspended'));