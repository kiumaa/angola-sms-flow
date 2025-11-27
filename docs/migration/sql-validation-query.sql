-- ============================================
-- Query de Validação de Dados para Migração
-- ============================================
-- Execute esta query no Supabase SQL Editor ANTES da migração
-- https://supabase.com/dashboard/project/hwxxcprqxqznselwzghi/sql/new
--
-- INSTRUÇÕES:
-- 1. Copie e cole esta query completa no SQL Editor
-- 2. Clique em "Run" ou pressione Ctrl+Enter
-- 3. Guarde os resultados para comparar após migração
-- 4. Documente os números no ficheiro NEXT-STEPS.md
-- ============================================

-- Contagem de registos principais
SELECT 
  'profiles' as tabela, 
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE user_status = 'active') as ativos,
  COUNT(*) FILTER (WHERE credits > 0) as com_creditos
FROM profiles

UNION ALL

SELECT 
  'contacts' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE is_blocked = false) as nao_bloqueados,
  COUNT(DISTINCT user_id) as utilizadores_unicos
FROM contacts

UNION ALL

SELECT 
  'transactions' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE status = 'completed') as completadas,
  COUNT(*) FILTER (WHERE status = 'pending') as pendentes
FROM transactions

UNION ALL

SELECT 
  'sms_logs' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE status = 'delivered') as entregues,
  COUNT(*) FILTER (WHERE status = 'failed') as falhados
FROM sms_logs

UNION ALL

SELECT 
  'campaigns' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE status = 'completed') as completas,
  COUNT(*) FILTER (WHERE status = 'active') as ativas
FROM campaigns

UNION ALL

SELECT 
  'sender_ids' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE status = 'approved') as aprovados,
  COUNT(*) FILTER (WHERE is_default = true) as defaults
FROM sender_ids

UNION ALL

SELECT 
  'credit_packages' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  NULL as info_extra
FROM credit_packages

UNION ALL

SELECT 
  'user_roles' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE role = 'admin') as admins,
  COUNT(*) FILTER (WHERE role = 'user') as users
FROM user_roles

UNION ALL

SELECT 
  'ekwanza_payments' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE status = 'paid') as pagos,
  COUNT(*) FILTER (WHERE status = 'pending') as pendentes
FROM ekwanza_payments

UNION ALL

SELECT 
  'otp_requests' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE used = false AND expires_at > now()) as validos,
  COUNT(*) FILTER (WHERE used = true) as usados
FROM otp_requests

UNION ALL

SELECT 
  'sms_configurations' as tabela,
  COUNT(*) as total_registos,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE credentials_encrypted = true) as encriptados
FROM sms_configurations

UNION ALL

SELECT 
  'contact_lists' as tabela,
  COUNT(*) as total_registos,
  NULL as info_coluna2,
  NULL as info_coluna3
FROM contact_lists

UNION ALL

SELECT 
  'message_templates' as tabela,
  COUNT(*) as total_registos,
  COUNT(DISTINCT account_id) as contas_utilizadoras,
  NULL as info_extra
FROM message_templates

ORDER BY tabela;

-- ============================================
-- Estatísticas Adicionais Importantes
-- ============================================

-- Total de créditos no sistema
SELECT 
  'TOTAL_CREDITOS_SISTEMA' as metrica,
  SUM(credits) as valor,
  AVG(credits) as media_por_utilizador
FROM profiles;

-- SMS enviados nos últimos 30 dias
SELECT 
  'SMS_ULTIMOS_30_DIAS' as metrica,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'delivered') as entregues
FROM sms_logs
WHERE created_at > now() - INTERVAL '30 days';

-- Transações nos últimos 30 dias
SELECT 
  'TRANSACOES_ULTIMOS_30_DIAS' as metrica,
  COUNT(*) as total,
  SUM(amount_kwanza) as valor_total_kwanza
FROM transactions
WHERE created_at > now() - INTERVAL '30 days';

-- Utilizadores ativos nos últimos 7 dias
SELECT 
  'UTILIZADORES_ATIVOS_7_DIAS' as metrica,
  COUNT(DISTINCT user_id) as total,
  NULL as info_extra
FROM sms_logs
WHERE created_at > now() - INTERVAL '7 days';

-- ============================================
-- INSTRUÇÕES PÓS-EXECUÇÃO:
-- ============================================
-- 1. Copie TODOS os resultados (4 tabelas acima)
-- 2. Cole num ficheiro de texto ou spreadsheet
-- 3. Guarde com nome: validation-pre-migration-YYYY-MM-DD.txt
-- 4. Após migração, execute novamente para comparar
-- 5. Diferenças = problemas na migração
-- ============================================
