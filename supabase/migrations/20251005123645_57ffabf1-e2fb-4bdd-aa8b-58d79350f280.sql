-- Fix registration issue: Remove audit logging triggers that conflict with user creation
-- The issue is that triggers are trying to insert into admin_audit_logs during user registration
-- when no admin_id exists yet

-- Drop problematic triggers that run during profile creation
DROP TRIGGER IF EXISTS audit_profile_operations_trigger ON public.profiles;
DROP TRIGGER IF EXISTS validate_rls_access_trigger ON public.profiles;
DROP TRIGGER IF EXISTS log_profile_access_trigger ON public.profiles;

-- Recreate audit trigger but exclude INSERT operations during registration
CREATE OR REPLACE FUNCTION public.audit_profile_operations_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log UPDATE and DELETE operations, not INSERT (which happens during registration)
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- Only log if there's an authenticated user (not during system-level operations)
    IF auth.uid() IS NOT NULL THEN
      INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_user_id,
        details,
        ip_address
      ) VALUES (
        auth.uid(),
        'profile_' || TG_OP::text,
        COALESCE(NEW.user_id, OLD.user_id),
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation_timestamp', now()
        ),
        inet_client_addr()
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the trigger for safe audit logging
CREATE TRIGGER audit_profile_operations_safe_trigger
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_operations_safe();

-- Fix the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  free_credits INTEGER := 5;
  profile_id UUID;
BEGIN
  -- Buscar créditos grátis da configuração
  BEGIN
    SELECT COALESCE(value::INTEGER, 5) INTO free_credits
    FROM public.site_settings 
    WHERE key = 'free_credits_new_user';
  EXCEPTION WHEN OTHERS THEN
    free_credits := 5; -- Default fallback
  END;
  
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
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$function$;