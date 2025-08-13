-- Adicionar configuração admin para OTP e ajustar créditos gratuitos
INSERT INTO site_settings (key, value, description) 
VALUES 
  ('otp_enabled', 'true', 'Ativar verificação OTP no registro'),
  ('free_credits_new_user', '10', 'Quantidade de créditos gratuitos para novos usuários')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Atualizar função handle_new_user para dar 10 créditos em vez de 50
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    10  -- Definir 10 créditos gratuitos
  );
  
  -- Criar role padrão de client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$function$;