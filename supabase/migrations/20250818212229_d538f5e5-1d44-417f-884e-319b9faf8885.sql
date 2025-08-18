-- ========================================
-- MANDATO: Padronização SMSAO + Remoção ONSMS
-- ========================================

-- 1) Limpar e padronizar sender_ids - remover ONSMS
UPDATE sender_ids 
SET status = 'archived' 
WHERE UPPER(sender_id) = 'ONSMS' OR UPPER(sender_id) LIKE '%ONSMS%';

-- 2) Garantir que SMSAO existe como padrão para todos os usuários ativos
INSERT INTO sender_ids (user_id, sender_id, status, is_default, bulksms_status, supported_gateways)
SELECT DISTINCT p.user_id, 'SMSAO', 'approved', true, 'approved', ARRAY['bulksms']
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM sender_ids s 
    WHERE s.user_id = p.user_id AND UPPER(s.sender_id) = 'SMSAO' AND s.status != 'archived'
);

-- 3) Backfill todas as tabelas com sender_id - substituir ONSMS/NULL por SMSAO
UPDATE campaigns 
SET sender_id = 'SMSAO' 
WHERE sender_id IS NULL OR UPPER(sender_id) = 'ONSMS' OR UPPER(sender_id) LIKE '%ONSMS%';

UPDATE campaign_targets 
SET rendered_message = REPLACE(rendered_message, 'ONSMS', 'SMSAO')
WHERE rendered_message LIKE '%ONSMS%';

UPDATE sms_logs 
SET gateway_message_id = REPLACE(gateway_message_id, 'ONSMS', 'SMSAO')
WHERE gateway_message_id LIKE '%ONSMS%';

-- 4) Atualizar profiles para usar SMSAO como padrão
UPDATE profiles 
SET default_sender_id = 'SMSAO' 
WHERE default_sender_id IS NULL OR UPPER(default_sender_id) = 'ONSMS' OR UPPER(default_sender_id) LIKE '%ONSMS%';

-- 5) Garantir que todos os usuários têm SMSAO como default
UPDATE sender_ids 
SET is_default = false 
WHERE is_default = true AND UPPER(sender_id) != 'SMSAO';

UPDATE sender_ids 
SET is_default = true 
WHERE UPPER(sender_id) = 'SMSAO' AND status = 'approved';

-- 6) Criar constraint para evitar duplicados case-insensitive por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_sender_ids_user_name_ci 
ON sender_ids(user_id, LOWER(sender_id)) 
WHERE status != 'archived';

-- 7) Adicionar configuração global padrão
INSERT INTO site_settings (key, value, description) 
VALUES ('DEFAULT_SENDER_ID', 'SMSAO', 'Sender ID padrão para toda a plataforma')
ON CONFLICT (key) DO UPDATE SET 
  value = 'SMSAO',
  description = 'Sender ID padrão para toda a plataforma',
  updated_at = now();

-- 8) Criar função helper para obter sender ID padrão
CREATE OR REPLACE FUNCTION public.get_default_sender_id(account_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_sender TEXT := 'SMSAO';
BEGIN
  -- Sempre retorna SMSAO como padrão por enquanto
  -- No futuro pode ser estendido para multi-tenant
  RETURN default_sender;
END;
$function$;