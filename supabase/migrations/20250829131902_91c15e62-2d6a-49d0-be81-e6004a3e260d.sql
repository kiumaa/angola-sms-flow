-- Corrigir função handle_new_user com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  free_credits INTEGER := 5; -- Valor padrão
BEGIN
  -- Buscar créditos grátis da configuração
  SELECT COALESCE(value::INTEGER, 5) INTO free_credits
  FROM public.site_settings 
  WHERE key = 'free_credits_new_user';
  
  INSERT INTO public.profiles (user_id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    free_credits
  );
  
  -- Criar role padrão de client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;