-- Fix function search path security warnings

-- Update set_updated_at function with proper search path
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now(); 
  RETURN NEW;
END;
$$;

-- Update get_current_account_id function with proper search path  
CREATE OR REPLACE FUNCTION public.get_current_account_id()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;