-- Fix handle_new_user function to avoid foreign key violations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  free_credits INTEGER := 5;
  profile_id UUID;
BEGIN
  -- Buscar créditos grátis da configuração
  SELECT COALESCE(value::INTEGER, 5) INTO free_credits
  FROM public.site_settings 
  WHERE key = 'free_credits_new_user';
  
  -- Criar o perfil do usuário
  INSERT INTO public.profiles (user_id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    free_credits
  )
  RETURNING id INTO profile_id;
  
  -- Criar role padrão de client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  -- Não criar registro de auditoria durante criação automática
  -- O registro de auditoria será criado posteriormente se necessário
  
  RETURN NEW;
END;
$$;

-- Update enhanced_audit_logging to skip when auth.uid() is NULL
CREATE OR REPLACE FUNCTION public.enhanced_audit_logging()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update audit_critical_changes to skip when auth.uid() is NULL
CREATE OR REPLACE FUNCTION public.audit_critical_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if auth.uid() is not NULL
  IF auth.uid() IS NOT NULL THEN
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
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update audit_sms_config_changes to handle NULL auth.uid()
CREATE OR REPLACE FUNCTION public.audit_sms_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create a function to grant welcome credits after successful user creation
CREATE OR REPLACE FUNCTION public.grant_welcome_credits(
  _user_id uuid,
  _credits integer DEFAULT 5
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_admin_id uuid;
BEGIN
  -- Get first admin for audit trail
  SELECT user_id INTO first_admin_id
  FROM public.user_roles 
  WHERE role = 'admin'::app_role 
  LIMIT 1;
  
  -- Create audit record for welcome credits (only if admin exists)
  IF first_admin_id IS NOT NULL THEN
    INSERT INTO public.credit_adjustments (
      user_id,
      admin_id,
      delta,
      previous_balance,
      new_balance,
      adjustment_type,
      reason,
      is_free_credit
    ) VALUES (
      _user_id,
      first_admin_id,
      _credits,
      0,
      _credits,
      'welcome_bonus',
      'Créditos grátis de boas-vindas para novo usuário',
      true
    );
  END IF;
END;
$$;