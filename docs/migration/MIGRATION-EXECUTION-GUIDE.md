# Guia de Execução - Migração para Lovable Cloud

## 📋 Status: PRONTO PARA EXECUTAR

**Fase Atual:** Preparação concluída, aguardando ativação do Lovable Cloud

---

## 🚀 PASSO 1: Ativar Lovable Cloud

### 1.1 Ativar no Dashboard Lovable

1. **Aceder ao projeto no Lovable**
2. **Clicar em "Cloud"** (menu lateral esquerdo)
3. **Clicar em "Enable Cloud"**
4. **Confirmar ativação**

✅ **Resultado esperado:** Lovable Cloud ativo com Supabase provisionado automaticamente

---

## 🔑 PASSO 2: Configurar Secrets

### 2.1 Secrets Críticos (fornecer via chat ao assistente)

O assistente irá solicitar os seguintes secrets:

#### SMS Gateways (4 secrets)
```
BULKSMS_TOKEN_ID=?
BULKSMS_TOKEN_SECRET=?
BULKGATE_API_KEY=?
BULKGATE_APPLICATION_ID=?
```

#### eKwanza Pagamentos (12 secrets)
```
EKWANZA_CLIENT_ID=?
EKWANZA_CLIENT_SECRET=?
EKWANZA_ACCOUNT_NUMBER=?
EKWANZA_MERCHANT_NUMBER=?
EKWANZA_NOTIFICATION_TOKEN=?
EKWANZA_BASE_URL=?
EKWANZA_OAUTH_URL=?
EKWANZA_RESOURCE=?
EKWANZA_GPO_API_KEY=?
EKWANZA_GPO_PAYMENT_METHOD=?
EKWANZA_GPR_API_KEY=?
EKWANZA_REF_PAYMENT_METHOD=?
ENABLE_REFERENCIA_EMIS=?
```

#### Segurança (1 secret)
```
OTP_PEPPER=?
```

#### SMTP Email (5 secrets)
```
SMTP_HOST=?
SMTP_PORT=?
SMTP_USER=?
SMTP_PASSWORD=?
SMTP_FROM_EMAIL=?
```

### 2.2 Como fornecer os secrets

**Via Chat:**
```
Aqui estão os secrets:

BULKSMS_TOKEN_ID=abc123
BULKSMS_TOKEN_SECRET=xyz789
...
```

O assistente irá configurá-los automaticamente no Lovable Cloud.

---

## 💾 PASSO 3: Deploy do Schema

### 3.1 Executar Schema Consolidado

O assistente irá:
1. ✅ Criar todas as tabelas
2. ✅ Configurar indexes
3. ✅ Ativar RLS em todas as tabelas
4. ✅ Criar policies RLS
5. ✅ Criar funções PostgreSQL
6. ✅ Criar triggers
7. ✅ Inserir dados iniciais

**Ficheiro usado:** `docs/migration/consolidated-schema.sql`

---

## 🔄 PASSO 4: Deploy das Edge Functions

### 4.1 Edge Functions Existentes

O assistente irá fazer deploy de **40+ Edge Functions**:

#### Críticas para funcionamento:
- ✅ `send-sms-bulksms` - Envio SMS via BulkSMS
- ✅ `send-quick-sms-with-pricing` - Envio rápido com pricing
- ✅ `ekwanza-create-payment` - Criar pagamentos eKwanza
- ✅ `ekwanza-check-status` - Verificar status pagamentos
- ✅ `ekwanza-webhook` - Receber callbacks eKwanza
- ✅ `send-otp` - Enviar OTP para login
- ✅ `verify-otp` - Verificar OTP
- ✅ `ensure-profile` - Criar perfil após registo

#### Suporte e gestão:
- ✅ `admin-notifications-api` - Notificações admin
- ✅ `campaigns-api` - Gestão de campanhas
- ✅ `contacts-api` - Gestão de contactos
- ✅ `branding-api` - Customização visual

**Total:** Todas as Edge Functions serão deployed automaticamente

---

## 🧪 PASSO 5: Testes de Validação

### 5.1 Testes Automáticos

O assistente irá executar:

1. ✅ **Teste de conectividade** - Verificar Supabase
2. ✅ **Teste de secrets** - Confirmar todos os secrets
3. ✅ **Teste SMS** - Enviar SMS de teste
4. ✅ **Teste eKwanza** - Simular pagamento
5. ✅ **Teste OTP** - Login via OTP
6. ✅ **Teste Admin** - Funcionalidades admin

### 5.2 Validações Manuais (Opcional)

**Login:**
- [ ] Aceder à aplicação
- [ ] Fazer login com email/password
- [ ] Fazer login com OTP

**Envio SMS:**
- [ ] Enviar SMS rápido
- [ ] Verificar entrega
- [ ] Confirmar débito de créditos

**Pagamentos:**
- [ ] Criar pagamento teste (Ticket QR)
- [ ] Verificar geração de referência
- [ ] Simular callback de confirmação

---

## 📊 PASSO 6: Migração de Dados (Opcional)

### 6.1 Se houver dados na base atual

**Opção A: Backup e Restore**
```sql
-- Executar no Supabase antigo
pg_dump -h [OLD_HOST] -U postgres -Fc [DB_NAME] > backup.dump

-- Restaurar no Lovable Cloud
pg_restore -h [NEW_HOST] -U postgres -d [NEW_DB] backup.dump
```

**Opção B: Export/Import por tabela**
```sql
-- Export CSV
COPY users TO '/tmp/users.csv' WITH CSV HEADER;

-- Import no novo DB
COPY users FROM '/tmp/users.csv' WITH CSV HEADER;
```

### 6.2 Ordem de migração de dados

1. `profiles` (usuários)
2. `contacts` (contactos)
3. `transactions` (transações)
4. `credit_adjustments` (ajustes de crédito)
5. `sms_logs` (logs SMS)
6. Restantes tabelas

---

## ✅ PASSO 7: Validação Final

### 7.1 Checklist de Produção

- [ ] Todos os secrets configurados
- [ ] Schema deployed com sucesso
- [ ] Edge Functions operacionais
- [ ] Testes de SMS passam
- [ ] Testes de pagamento passam
- [ ] OTP funciona
- [ ] Admin dashboard acessível
- [ ] RLS policies ativas
- [ ] Logs de audit funcionais

### 7.2 Métricas de Sucesso

**Performance:**
- Tempo resposta API < 500ms
- Taxa sucesso SMS > 95%
- Taxa sucesso pagamentos > 90%

**Segurança:**
- RLS ativo em todas as tabelas
- Secrets encriptados
- Audit logs funcionais
- Rate limiting ativo

---

## 🔧 PASSO 8: Configurações Pós-Migração

### 8.1 Variáveis de ambiente frontend

O assistente irá atualizar automaticamente:
```typescript
// src/integrations/supabase/client.ts
const supabaseUrl = '[LOVABLE_CLOUD_URL]'
const supabaseAnonKey = '[LOVABLE_CLOUD_ANON_KEY]'
```

### 8.2 Webhooks externos

**Atualizar URLs de callback:**

**BulkSMS Delivery Webhook:**
```
Novo URL: https://[PROJECT_ID].lovable.app/functions/v1/bulksms-delivery-webhook
```

**eKwanza Notification Webhook:**
```
Novo URL: https://[PROJECT_ID].lovable.app/functions/v1/ekwanza-webhook
```

---

## 🚨 Rollback (em caso de problemas)

### Se algo correr mal:

1. **Manter sistema antigo online** (não desligar ainda)
2. **Reverter DNS** para sistema antigo
3. **Analisar logs** de erro no Lovable Cloud
4. **Corrigir issues** identificados
5. **Tentar novamente**

---

## 📞 Suporte Durante Migração

**Assistente AI:**
- Disponível no chat para resolver problemas
- Pode executar queries SQL
- Pode verificar logs
- Pode reconfigurar secrets

**Lovable Support:**
- Chat no dashboard: https://lovable.dev
- Discord: https://discord.gg/lovable

---

## 🎯 Próximos Passos IMEDIATOS

### O que fazer AGORA:

1. ✅ **Ativar Lovable Cloud** no dashboard
2. ✅ **Fornecer secrets** via chat ao assistente
3. ✅ **Aguardar deploy** automático
4. ✅ **Testar funcionalidades** críticas

---

**Status:** ⏳ Aguardando ativação do Lovable Cloud

**Tempo estimado total:** 15-30 minutos após ativação

**Última atualização:** 2025-11-27
