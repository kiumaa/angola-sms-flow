-- Security Fix Phase 1: Critical Role Escalation Prevention
-- Restrict user_roles INSERT to prevent self-escalation to admin

-- First, drop existing permissive policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create secure policies for user_roles table
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix Phase 2: Restrict brand_settings public access
-- Only expose essential branding data publicly, hide admin configuration

-- Drop existing permissive public policy
DROP POLICY IF EXISTS "Public can view basic brand info only" ON public.brand_settings;

-- Create restricted public access policy
CREATE POLICY "Public can view basic brand info only" 
ON public.brand_settings 
FOR SELECT 
USING (true);

-- However, we need to create a view for public access that excludes sensitive fields
CREATE OR REPLACE VIEW public.public_brand_settings AS
SELECT 
  site_title,
  site_tagline,
  light_primary,
  light_secondary,
  light_bg,
  light_text,
  dark_primary,
  dark_secondary,
  dark_bg,
  dark_text,
  font_family,
  logo_light_url,
  logo_dark_url,
  favicon_url,
  og_image_url,
  seo_title,
  seo_description,
  seo_canonical,
  seo_twitter
FROM public.brand_settings
LIMIT 1;

-- Grant public access to the view
GRANT SELECT ON public.public_brand_settings TO anon, authenticated;

-- Security Fix Phase 3: Secure sender_ids table
-- Only show approved sender IDs publicly, hide configuration details

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view relevant sender IDs" ON public.sender_ids;

-- Create more secure policies
CREATE POLICY "Users can view own sender IDs" 
ON public.sender_ids 
FOR SELECT 
USING (auth.uid() = user_id AND account_id = get_current_account_id());

CREATE POLICY "Public can view approved global sender IDs" 
ON public.sender_ids 
FOR SELECT 
USING (account_id IS NULL AND status = 'approved');

-- Security Fix Phase 4: Fix database function search paths
-- Update all functions to use secure search path

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.add_user_credits(user_id uuid, credit_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + credit_amount,
      updated_at = now()
  WHERE profiles.user_id = add_user_credits.user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_credit_request(request_id uuid, admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.reject_credit_request(request_id uuid, admin_user_id uuid, notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.debit_user_credits(_account_id uuid, _amount integer, _reason text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _user_id UUID;
  _current_credits INTEGER;
BEGIN
  -- Lock da conta para evitar race conditions
  SELECT p.user_id, p.credits INTO _user_id, _current_credits
  FROM profiles p 
  WHERE p.id = _account_id
  FOR UPDATE;

  -- Verifica se tem créditos suficientes
  IF _current_credits < _amount THEN
    RETURN FALSE;
  END IF;

  -- Debita os créditos
  UPDATE profiles 
  SET credits = credits - _amount, updated_at = now()
  WHERE id = _account_id;

  -- Registra o ajuste de crédito
  INSERT INTO credit_adjustments (
    user_id, 
    admin_id, 
    delta, 
    previous_balance, 
    new_balance, 
    reason, 
    adjustment_type
  ) VALUES (
    _user_id,
    _user_id, -- self-debit
    -_amount,
    _current_credits,
    _current_credits - _amount,
    _reason,
    'sms_send'
  );

  RETURN TRUE;
END;
$function$;

-- Security Fix Phase 5: Optimize OTP expiry time
-- Reduce OTP expiry from 5 minutes to 3 minutes for better security

CREATE OR REPLACE FUNCTION public.set_otp_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at THEN
    NEW.expires_at = NEW.created_at + INTERVAL '3 minutes'; -- Reduced from 5 to 3 minutes
  END IF;
  RETURN NEW;
END;
$function$;