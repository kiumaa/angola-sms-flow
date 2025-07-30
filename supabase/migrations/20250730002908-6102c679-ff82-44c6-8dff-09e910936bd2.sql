-- Corrigir funções com search_path mutable para segurança

-- 1. Atualizar função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 2. Atualizar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Criar role padrão de client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$function$;

-- 3. Atualizar função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Atualizar função add_user_credits
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id uuid, credit_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + credit_amount,
      updated_at = now()
  WHERE profiles.user_id = add_user_credits.user_id;
END;
$function$;

-- 5. Atualizar função count_contacts_in_list
CREATE OR REPLACE FUNCTION public.count_contacts_in_list(list_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.contact_list_members
  WHERE list_id = $1
$function$;

-- 6. Atualizar função approve_credit_request
CREATE OR REPLACE FUNCTION public.approve_credit_request(request_id uuid, admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- 7. Atualizar função reject_credit_request
CREATE OR REPLACE FUNCTION public.reject_credit_request(request_id uuid, admin_user_id uuid, notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- 8. Atualizar função encrypt_smtp_password
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Simple base64 encoding for now (in production, use proper encryption)
  RETURN encode(password_text::bytea, 'base64');
END;
$function$;

-- 9. Atualizar função decrypt_smtp_password
CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(encrypted_password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Simple base64 decoding for now (in production, use proper decryption)
  RETURN convert_from(decode(encrypted_password, 'base64'), 'UTF8');
END;
$function$;

-- 10. Atualizar função ensure_single_primary_gateway
CREATE OR REPLACE FUNCTION public.ensure_single_primary_gateway()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_primary = true THEN
    -- Desativar todos os outros gateways como primário
    UPDATE public.sms_gateways 
    SET is_primary = false 
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$function$;