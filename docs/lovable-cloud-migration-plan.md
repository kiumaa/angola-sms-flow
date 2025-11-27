# Plano de Migração para Lovable Cloud

## Status: Fase 1 - Preparação em Progresso

Data: 2025-11-27

---

## Visão Geral

Este documento detalha o plano completo de migração do projeto SMS AO do Supabase externo (hwxxcprqxqznselwzghi.supabase.co) para Lovable Cloud.

### Objetivos
- ✅ Migração sem perda de dados
- ✅ Downtime mínimo (< 1 hora)
- ✅ Manter todas as funcionalidades atuais
- ✅ Melhorar gestão unificada
- ✅ Simplificar deployment de Edge Functions

### Métricas Atuais do Projeto
- **Edge Functions**: 43 funções
- **Migrações SQL**: 186 ficheiros
- **Secrets**: 18 configurações sensíveis
- **Tabelas**: ~40 tabelas principais
- **PostgreSQL Functions**: ~50 funções customizadas

---

## 📋 FASE 1: PREPARAÇÃO (2-4 horas)

### 1.1 Exportação de Schema ✅

**Ficheiros a criar:**
- `docs/migration/consolidated-schema.sql` - Schema completo consolidado
- `docs/migration/database-functions.sql` - Todas as funções PostgreSQL
- `docs/migration/rls-policies.sql` - Todas as políticas RLS
- `docs/migration/triggers.sql` - Todos os triggers

**Ações:**
1. Consolidar 186 migrações num único ficheiro SQL
2. Extrair todas as funções PostgreSQL do contexto
3. Documentar todas as políticas RLS
4. Documentar todos os triggers

### 1.2 Documentação de Secrets ✅

**Secrets identificados (18 total):**

#### SMS Gateways
- `BULKSMS_TOKEN_ID` - Token ID BulkSMS API
- `BULKSMS_TOKEN_SECRET` - Token Secret BulkSMS API
- `BULKGATE_APPLICATION_ID` - Application ID BulkGate
- `BULKGATE_APPLICATION_TOKEN` - Token BulkGate

#### Pagamentos eKwanza
- `EKWANZA_CLIENT_ID` - Client ID eKwanza
- `EKWANZA_CLIENT_SECRET` - Secret eKwanza
- `EKWANZA_USERNAME` - Username eKwanza
- `EKWANZA_PASSWORD` - Password eKwanza

#### Supabase (serão substituídos)
- `SUPABASE_URL` - URL atual (será novo no Lovable Cloud)
- `SUPABASE_ANON_KEY` - Anon key (será nova)
- `SUPABASE_SERVICE_ROLE_KEY` - Service key (será nova)

#### Email/SMTP
- `SMTP_HOST` - Host SMTP
- `SMTP_PORT` - Porta SMTP
- `SMTP_USER` - Utilizador SMTP
- `SMTP_PASSWORD` - Password SMTP
- `SMTP_FROM_EMAIL` - Email remetente
- `SMTP_FROM_NAME` - Nome remetente

#### Outros
- `OTP_PEPPER` - Salt para hash de OTPs

**⚠️ AÇÃO REQUERIDA:**
- Documentar valores atuais dos secrets antes da migração
- Preparar script de re-inserção de secrets no Lovable Cloud

### 1.3 Exportação de Dados

**Tabelas principais a exportar (ordem por dependências):**

1. **Sem dependências:**
   - `brand_settings`
   - `site_settings`
   - `credit_packages`
   - `sms_gateways`
   - `country_pricing`
   - `gateway_routing_rules`
   - `data_retention_policies`

2. **Com auth.users:**
   - `profiles`
   - `user_roles`
   - `admin_mfa_settings`

3. **Com profiles:**
   - `contacts`
   - `contact_lists`
   - `contact_tags`
   - `sender_ids`
   - `message_templates`
   - `credit_requests`
   - `credit_adjustments`
   - `transactions`
   - `ekwanza_payments`

4. **Com contacts/campaigns:**
   - `campaigns`
   - `campaign_targets`
   - `campaign_stats`
   - `quick_send_jobs`
   - `quick_send_targets`

5. **Logs e auditoria:**
   - `sms_logs`
   - `admin_audit_logs`
   - `pii_access_audit`
   - `function_call_audit`
   - `payment_metrics`

6. **Temporárias/Limpeza antes de migração:**
   - `otp_requests` - Limpar antes de migrar
   - `contact_import_jobs` - Limpar jobs antigos

**Comandos SQL para exportação:**
```sql
-- Executar no Supabase Dashboard > SQL Editor
-- Exportar para CSV ou usar pg_dump

-- Exemplo de contagem para validação:
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'sms_logs', COUNT(*) FROM sms_logs;
```

### 1.4 Backup Completo

**Checklist:**
- [ ] Backup do Supabase via Dashboard (Settings > Database > Backups)
- [ ] Export manual via `pg_dump` se disponível
- [ ] Backup do código atual (já no git)
- [ ] Documentar valores dos secrets
- [ ] Screenshot das configurações críticas (Auth, Storage, etc.)

---

## 📋 FASE 2: CONFIGURAÇÃO LOVABLE CLOUD (1-2 horas)

### 2.1 Ativar Lovable Cloud
- [ ] Ativar Lovable Cloud no projeto Lovable
- [ ] Obter novas credenciais (URL, anon key, service key)
- [ ] Configurar região (preferencialmente Europa)

### 2.2 Aplicar Schema Consolidado
- [ ] Executar `consolidated-schema.sql` no Lovable Cloud
- [ ] Executar `database-functions.sql`
- [ ] Executar `rls-policies.sql`
- [ ] Executar `triggers.sql`
- [ ] Validar que todas as tabelas foram criadas

### 2.3 Recriar Secrets
- [ ] Inserir todos os 18 secrets no Lovable Cloud
- [ ] Validar acesso aos secrets pelas Edge Functions
- [ ] Testar conectividade com APIs externas (BulkSMS, eKwanza)

### 2.4 Configurar Autenticação
- [ ] Configurar providers de auth (Email, Phone)
- [ ] Configurar templates de email
- [ ] Configurar redirect URLs
- [ ] Testar fluxo de registo/login

---

## 📋 FASE 3: MIGRAÇÃO DE DADOS (1-2 horas)

### 3.1 Importação de Dados
**Ordem crítica (respeitar foreign keys):**

```sql
-- 1. Dados base (sem dependências)
INSERT INTO brand_settings ...
INSERT INTO site_settings ...
INSERT INTO credit_packages ...

-- 2. Utilizadores (requer migração de auth.users primeiro)
-- NOTA: auth.users é gerido pelo Supabase Auth, precisa de script especial
INSERT INTO profiles ...
INSERT INTO user_roles ...

-- 3. Dados de negócio
INSERT INTO contacts ...
INSERT INTO sender_ids ...
INSERT INTO campaigns ...

-- 4. Transações e logs
INSERT INTO transactions ...
INSERT INTO sms_logs ...
```

### 3.2 Validação de Integridade
```sql
-- Verificar contagens
SELECT 'profiles' as table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts;

-- Verificar foreign keys
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';

-- Verificar orphaned records
SELECT COUNT(*) FROM contacts c
LEFT JOIN profiles p ON c.account_id = p.id
WHERE p.id IS NULL;
```

---

## 📋 FASE 4: ATUALIZAÇÃO DO CÓDIGO (30 minutos)

### 4.1 Atualizar Cliente Supabase
**Ficheiro:** `src/integrations/supabase/client.ts`

```typescript
// ANTES (Supabase externo)
const SUPABASE_URL = "https://hwxxcprqxqznselwzghi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGc...";

// DEPOIS (Lovable Cloud)
const SUPABASE_URL = "[NOVA_URL_LOVABLE_CLOUD]";
const SUPABASE_PUBLISHABLE_KEY = "[NOVA_KEY_LOVABLE_CLOUD]";
```

### 4.2 Atualizar .env
```env
# ANTES
VITE_SUPABASE_URL="https://hwxxcprqxqznselwzghi.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."

# DEPOIS
VITE_SUPABASE_URL="[NOVA_URL_LOVABLE_CLOUD]"
VITE_SUPABASE_PUBLISHABLE_KEY="[NOVA_KEY_LOVABLE_CLOUD]"
```

### 4.3 Deploy Edge Functions
- [ ] Verificar que as 43 Edge Functions foram deployed automaticamente
- [ ] Testar cada Edge Function crítica
- [ ] Validar logs das Edge Functions

---

## 📋 FASE 5: VALIDAÇÃO E GO-LIVE (2-4 horas)

### 5.1 Testes Funcionais

**Autenticação:**
- [ ] Registo de novo utilizador
- [ ] Login com email/password
- [ ] Login com OTP
- [ ] Recuperação de password
- [ ] Verificação de email

**SMS:**
- [ ] Envio via Quick Send
- [ ] Envio via Campanha
- [ ] Validação de créditos
- [ ] Webhook delivery status (BulkSMS)
- [ ] Fallback entre gateways

**Pagamentos:**
- [ ] Criação de pagamento eKwanza (Ticket/QR)
- [ ] Criação de pagamento MCX Express
- [ ] Criação de Referência EMIS
- [ ] Webhook de confirmação
- [ ] Atualização de créditos

**Admin:**
- [ ] Dashboard de admin
- [ ] Gestão de utilizadores
- [ ] Ajustes de créditos
- [ ] Visualização de logs
- [ ] Configurações de sistema

### 5.2 Monitorização (24-48h)
- [ ] Logs de erros nas Edge Functions
- [ ] Performance das queries
- [ ] Taxa de sucesso de SMS
- [ ] Taxa de sucesso de pagamentos
- [ ] Feedback de utilizadores

### 5.3 Rollback Plan (se necessário)
Se algo correr mal:
1. Reverter `src/integrations/supabase/client.ts` para URLs antigas
2. Reverter `.env` para credenciais antigas
3. Fazer redeploy
4. Investigar problema no Lovable Cloud
5. Tentar migração novamente quando resolvido

---

## ⚠️ PONTOS DE ATENÇÃO

### Downtime Esperado
- **Mínimo:** 30 minutos (se tudo correr bem)
- **Máximo:** 2 horas (se houver problemas)
- **Janela recomendada:** Madrugada ou fim-de-semana

### Riscos Identificados
1. **Migração de auth.users** - Requer script especial ou re-registo
2. **Webhooks externos** - Podem precisar de URLs atualizadas
3. **Secrets** - Erros de configuração bloqueiam SMS/pagamentos
4. **RLS Policies** - Podem causar erros de permissão se mal aplicadas

### Contingências
- Manter Supabase externo ativo por 7 dias após migração
- Ter backup completo antes de começar
- Testar em ambiente de staging primeiro (se possível)

---

## 📊 CHECKLIST FINAL PRÉ-MIGRAÇÃO

### Documentação
- [ ] Schema consolidado criado
- [ ] Funções PostgreSQL documentadas
- [ ] RLS policies documentadas
- [ ] Triggers documentados
- [ ] Secrets documentados com valores

### Backups
- [ ] Backup Supabase Dashboard
- [ ] Export SQL manual
- [ ] Código em git commitado
- [ ] Screenshots de configurações

### Comunicação
- [ ] Notificar utilizadores sobre manutenção
- [ ] Definir janela de manutenção
- [ ] Preparar mensagem de status

### Equipa
- [ ] Equipa disponível durante migração
- [ ] Plano de rollback testado
- [ ] Contactos de emergência preparados

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Consolidar Schema SQL** (30 min)
   - Criar `consolidated-schema.sql` a partir das 186 migrações
   - Extrair funções, triggers e policies

2. **Documentar Secrets** (15 min)
   - Obter valores atuais dos 18 secrets
   - Criar documento seguro com valores

3. **Exportar Dados** (1 hora)
   - Executar exports das tabelas principais
   - Validar contagens de registos

4. **Agendar Janela de Manutenção** (decisão necessária)
   - Quando fazer a migração?
   - Comunicar aos utilizadores

---

## 📞 SUPORTE

- **Lovable Support**: Usar chat de suporte no dashboard
- **Documentação**: https://docs.lovable.dev
- **Este documento**: Atualizar conforme progresso

---

**Última atualização:** 2025-11-27
**Responsável:** Equipa SMS AO
**Status:** Fase 1 em progresso
