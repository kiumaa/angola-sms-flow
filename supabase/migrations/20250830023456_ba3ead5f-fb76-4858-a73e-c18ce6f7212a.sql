-- Primeiro, atualizar o trigger de auditoria para não referenciar colunas que serão removidas
CREATE OR REPLACE FUNCTION public.audit_sms_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Agora executar a migração de segurança
UPDATE public.sms_configurations 
SET credentials_encrypted = true,
    updated_at = now()
WHERE gateway_name = 'bulksms' 
  AND api_token_secret_name IS NOT NULL 
  AND api_token_id_secret_name IS NOT NULL;

-- Registrar conclusão da migração
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
    'security_improvement', 'completed_migration_to_encrypted_secrets'
  ),
  inet_client_addr()
);

-- Remover colunas de credenciais inseguras
ALTER TABLE public.sms_configurations 
DROP COLUMN IF EXISTS api_token_id;

ALTER TABLE public.sms_configurations 
DROP COLUMN IF EXISTS api_token_secret;

-- Registrar remoção das credenciais
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'plaintext_credentials_removed',
  jsonb_build_object(
    'action', 'removed_plaintext_credential_columns',
    'security_improvement', 'eliminated_plaintext_credential_storage_risk',
    'migration_complete', true
  ),
  inet_client_addr()
);