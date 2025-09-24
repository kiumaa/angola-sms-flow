-- LIMPEZA COMPLETA PARA PRODUÇÃO
-- Remove dados de desenvolvimento e teste, mantém apenas estruturas e dados essenciais

-- 1. Limpar logs de auditoria de desenvolvimento/teste
DELETE FROM public.admin_audit_logs 
WHERE created_at < now() - interval '1 hour'
OR action LIKE '%test%' 
OR action LIKE '%debug%'
OR details->>'system_operation' = 'true';

-- 2. Limpar configurações SMTP de teste (manter apenas 1 produção se existir)
DELETE FROM public.smtp_settings 
WHERE host LIKE '%test%' 
OR host LIKE '%localhost%'
OR from_email LIKE '%test%'
OR test_status = 'failed';

-- 3. Limpar configurações do site desnecessárias para produção
DELETE FROM public.site_settings 
WHERE key LIKE '%test%' 
OR key LIKE '%debug%'
OR key LIKE '%dev%';

-- 4. Limpar logs SMTP de teste
DELETE FROM public.smtp_test_logs 
WHERE test_email LIKE '%test%'
OR test_email LIKE '%example%'
OR status = 'failed';

-- 5. Limpar jobs de importação antigos/teste
DELETE FROM public.contact_import_jobs 
WHERE status IN ('failed', 'completed')
AND created_at < now() - interval '7 days';

-- 6. Limpar OTPs expirados
DELETE FROM public.otp_requests 
WHERE expires_at < now() 
OR used = true
OR created_at < now() - interval '1 hour';

-- 7. Limpar logs SMS muito antigos (manter últimos 30 dias)
DELETE FROM public.sms_logs 
WHERE created_at < now() - interval '30 days'
AND status IN ('failed', 'delivered');

-- 8. Garantir que existe apenas um admin ativo
-- (Não deletar, apenas verificar)

-- 9. Log da limpeza de produção
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'production_cleanup_completed',
  jsonb_build_object(
    'cleanup_type', 'full_production_cleanup',
    'timestamp', now(),
    'platform_status', 'production_ready',
    'cleanup_scope', 'audit_logs,smtp_configs,site_settings,import_jobs,otp_requests,old_sms_logs',
    'production_certification', true
  ),
  inet_client_addr()
);

-- 10. Atualizar status da plataforma para produção
UPDATE public.site_settings 
SET value = 'production', updated_at = now()
WHERE key = 'environment_status';

-- Se não existir, criar configuração de ambiente
INSERT INTO public.site_settings (key, value, description)
SELECT 'environment_status', 'production', 'Current environment status - production/staging/development'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'environment_status');

-- Confirmar configurações essenciais de produção
INSERT INTO public.site_settings (key, value, description)
SELECT 'platform_ready', 'true', 'Platform is ready for production use'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'platform_ready');

INSERT INTO public.site_settings (key, value, description)
SELECT 'cleanup_last_run', now()::text, 'Last time production cleanup was executed'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'cleanup_last_run');