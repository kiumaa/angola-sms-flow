-- Fix search_path for remaining functions (Critical Security Fix)

-- Update all functions that don't have search_path set
CREATE OR REPLACE FUNCTION public.sanitize_html_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Remove tags HTML básicos e caracteres perigosos
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        COALESCE(input_text, ''),
        '<[^>]*>', '', 'g'  -- Remove HTML tags
      ),
      '[<>&"''`]', '', 'g'  -- Remove caracteres perigosos
    ),
    '\s+', ' ', 'g'  -- Normaliza espaços
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_primary_gateway()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_brand_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sanitize_user_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Sanitize text fields in profiles table
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.full_name = sanitize_html_input(NEW.full_name);
    NEW.company_name = sanitize_html_input(NEW.company_name);
    NEW.phone = sanitize_html_input(NEW.phone);
  END IF;
  
  -- Sanitize contact data
  IF TG_TABLE_NAME = 'contacts' THEN
    NEW.name = sanitize_html_input(NEW.name);
    NEW.notes = sanitize_html_input(NEW.notes);
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enhanced_audit_logging()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only log if auth.uid() is not NULL (skip during automatic user creation)
  IF auth.uid() IS NOT NULL THEN
    -- Log all admin operations with enhanced details
    IF TG_TABLE_NAME = 'user_roles' THEN
      INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_user_id,
        details,
        ip_address
      ) VALUES (
        auth.uid(),
        'user_role_' || TG_OP::text,
        COALESCE(NEW.user_id, OLD.user_id),
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'old_role', CASE WHEN TG_OP != 'INSERT' THEN OLD.role ELSE NULL END,
          'new_role', CASE WHEN TG_OP != 'DELETE' THEN NEW.role ELSE NULL END,
          'timestamp', now()
        ),
        inet_client_addr()
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_critical_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log para brand_settings
  IF TG_TABLE_NAME = 'brand_settings' THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      auth.uid(),
      'brand_settings_' || TG_OP::text,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_sms_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_admin_id uuid;
BEGIN
  -- Get admin_id, usando o primeiro admin se auth.uid() é null (para operações do sistema)
  current_admin_id := auth.uid();
  
  IF current_admin_id IS NULL THEN
    -- Para operações do sistema, usar o primeiro admin disponível
    SELECT user_id INTO current_admin_id 
    FROM user_roles 
    WHERE role = 'admin'::app_role 
    LIMIT 1;
  END IF;
  
  -- Só fazer log se temos um admin_id válido
  IF current_admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      current_admin_id,
      'sms_config_' || TG_OP::text,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'gateway_name', COALESCE(NEW.gateway_name, OLD.gateway_name),
        'credentials_encrypted', COALESCE(NEW.credentials_encrypted, OLD.credentials_encrypted),
        'uses_secure_secrets', CASE 
          WHEN COALESCE(NEW.api_token_secret_name, OLD.api_token_secret_name) IS NOT NULL THEN true
          ELSE false
        END,
        'system_operation', auth.uid() IS NULL,
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;