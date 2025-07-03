-- Create table for custom sender IDs
CREATE TABLE public.sender_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sender_id)
);

-- Enable RLS
ALTER TABLE public.sender_ids ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sender IDs" ON public.sender_ids
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sender IDs" ON public.sender_ids
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sender IDs" ON public.sender_ids
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sender IDs" ON public.sender_ids
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_sender_ids_updated_at
  BEFORE UPDATE ON public.sender_ids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add default sender ID column to profiles
ALTER TABLE public.profiles 
ADD COLUMN default_sender_id TEXT DEFAULT 'SMSao';