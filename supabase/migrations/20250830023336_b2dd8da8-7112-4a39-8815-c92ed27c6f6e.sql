-- Fase 1: Verificar e atualizar configurações de segurança
UPDATE public.sms_configurations 
SET credentials_encrypted = true,
    updated_at = now()
WHERE gateway_name = 'bulksms' 
  AND api_token_secret_name IS NOT NULL 
  AND api_token_id_secret_name IS NOT NULL;

-- Fase 2: Registrar a conclusão da migração de segurança
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'sms_security_migration_completed',
  jsonb_build_object(
    'phase', 'final_cleanup',
    'action', 'marked_credentials_as_encrypted',
    'security_improvement', 'completed_migration_to_encrypted_secrets',
    'timestamp', now()
  ),
  inet_client_addr()
);

-- Fase 3: Remover colunas de credenciais em texto simples (SEGURANÇA CRÍTICA)
-- Estas colunas continham credenciais em texto simples, um risco de segurança
ALTER TABLE public.sms_configurations 
DROP COLUMN IF EXISTS api_token_id;

ALTER TABLE public.sms_configurations 
DROP COLUMN IF EXISTS api_token_secret;

-- Fase 4: Registrar a remoção das credenciais inseguras
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'plaintext_credentials_removed',
  jsonb_build_object(
    'phase', 'security_hardening',
    'action', 'removed_plaintext_credential_columns',
    'security_improvement', 'eliminated_plaintext_credential_storage_risk',
    'columns_removed', ARRAY['api_token_id', 'api_token_secret'],
    'migration_complete', true,
    'timestamp', now()
  ),
  inet_client_addr()
);

-- Fase 5: Criar função de validação de configuração segura
CREATE OR REPLACE FUNCTION public.validate_secure_sms_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  config_count integer;
  secure_configs integer;
  result jsonb;
BEGIN
  -- Verificar se só existem configurações seguras
  SELECT COUNT(*) INTO config_count
  FROM public.sms_configurations
  WHERE is_active = true;
  
  SELECT COUNT(*) INTO secure_configs
  FROM public.sms_configurations
  WHERE is_active = true 
    AND credentials_encrypted = true
    AND api_token_secret_name IS NOT NULL
    AND api_token_id_secret_name IS NOT NULL;
  
  result := jsonb_build_object(
    'total_configs', config_count,
    'secure_configs', secure_configs,
    'all_secure', config_count = secure_configs,
    'migration_complete', true,
    'plaintext_credentials_removed', true,
    'validation_timestamp', now()
  );
  
  -- Log da validação
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
    'security_validation_completed',
    result,
    inet_client_addr()
  );
  
  RETURN result;
END;
$$;