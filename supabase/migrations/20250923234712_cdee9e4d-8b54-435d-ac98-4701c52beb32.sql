-- LIMPEZA COMPLETA DA PLATAFORMA SMS AO (VERSÃO FINAL)
-- Remove todos os dados operacionais mantendo apenas configurações essenciais

-- Desabilitar temporariamente triggers de validação
SET session_replication_role = replica;

-- 1. IDENTIFICAR E PRESERVAR ADMINS
CREATE TEMP TABLE admin_users AS 
SELECT DISTINCT p.user_id, p.id as profile_id
FROM public.profiles p
JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'admin'::app_role;

-- 2. LIMPAR DADOS DE LOGS E HISTÓRICO
TRUNCATE public.sms_logs RESTART IDENTITY CASCADE;
TRUNCATE public.smtp_test_logs RESTART IDENTITY CASCADE;
DELETE FROM public.admin_audit_logs WHERE created_at < now() - INTERVAL '7 days';

-- 3. LIMPAR DADOS DE CAMPANHAS E ENVIOS
TRUNCATE public.campaign_targets RESTART IDENTITY CASCADE;
TRUNCATE public.campaign_stats RESTART IDENTITY CASCADE;
TRUNCATE public.quick_send_targets RESTART IDENTITY CASCADE;
TRUNCATE public.quick_send_jobs RESTART IDENTITY CASCADE;
TRUNCATE public.campaigns RESTART IDENTITY CASCADE;
TRUNCATE public.sms_campaigns RESTART IDENTITY CASCADE;

-- 4. LIMPAR DADOS DE CONTATOS E LISTAS
TRUNCATE public.contact_tag_pivot RESTART IDENTITY CASCADE;
TRUNCATE public.contact_list_members RESTART IDENTITY CASCADE;
TRUNCATE public.contacts RESTART IDENTITY CASCADE;
TRUNCATE public.contact_lists RESTART IDENTITY CASCADE;
TRUNCATE public.contact_tags RESTART IDENTITY CASCADE;
TRUNCATE public.contact_import_jobs RESTART IDENTITY CASCADE;

-- 5. LIMPAR DADOS TRANSACIONAIS
TRUNCATE public.transactions RESTART IDENTITY CASCADE;
TRUNCATE public.credit_requests RESTART IDENTITY CASCADE;
TRUNCATE public.credit_adjustments RESTART IDENTITY CASCADE;

-- 6. LIMPAR TEMPLATES E DADOS DE USUÁRIO
TRUNCATE public.message_templates RESTART IDENTITY CASCADE;
DELETE FROM public.sender_ids WHERE account_id IS NOT NULL;

-- 7. LIMPAR DADOS TEMPORÁRIOS
TRUNCATE public.user_consents RESTART IDENTITY CASCADE;
TRUNCATE public.otp_requests RESTART IDENTITY CASCADE;

-- 8. LIMPAR USUÁRIOS NÃO-ADMIN
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT user_id FROM admin_users);

DELETE FROM public.user_roles 
WHERE role != 'admin'::app_role;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

-- 9. RESETAR CONFIGURAÇÕES
UPDATE public.sms_configurations 
SET balance = 0, last_balance_check = now();

UPDATE public.gateway_overrides SET is_active = false;

-- 10. CONFIGURAR CRÉDITOS PADRÃO
INSERT INTO public.site_settings (key, value, description) 
VALUES ('free_credits_new_user', '5', 'Créditos gratuitos para novos usuários')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- 11. ATIVAR PELO MENOS UM PACOTE
UPDATE public.credit_packages SET is_active = true WHERE id IN (
  SELECT id FROM public.credit_packages ORDER BY credits ASC LIMIT 1
);

-- 12. EXECUTAR LIMPEZA DE OTPs
SELECT public.cleanup_expired_otps();

-- 13. LOG FINAL DA OPERAÇÃO
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) SELECT 
  user_id,
  'platform_complete_cleanup_success',
  jsonb_build_object(
    'action', 'complete_platform_cleanup_executed',
    'timestamp', now(),
    'preserved_admin_users', (SELECT COUNT(*) FROM admin_users),
    'method', 'safe_truncate',
    'status', 'completed_successfully'
  ),
  inet_client_addr()
FROM admin_users LIMIT 1;

-- 14. RESULTADO
SELECT 
  'LIMPEZA CONCLUÍDA COM SUCESSO!' as status,
  (SELECT COUNT(*) FROM public.profiles) as usuarios_restantes,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'::app_role) as admins_preservados,
  (SELECT COUNT(*) FROM public.credit_packages WHERE is_active = true) as pacotes_ativos,
  (SELECT COUNT(*) FROM public.brand_settings) as configs_preservadas;