# Documentação de Secrets para Migração

## ⚠️ CONFIDENCIAL - NÃO COMMITAR VALORES REAIS

Este documento serve como template para documentar os secrets antes da migração para Lovable Cloud.

---

## Secrets Atuais (18 total)

### 1. SMS Gateways (3 secrets)

#### BULKGATE_API_KEY
- **Tipo:** API Key
- **Uso:** Autenticação BulkGate API
- **Usado em:**
  - `supabase/functions/bulkgate-test/`
  - `supabase/functions/bulkgate-balance/`
  - `supabase/functions/save-bulkgate-credentials/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### BULKSMS_TOKEN_ID
- **Tipo:** Token ID
- **Uso:** Autenticação BulkSMS API
- **Usado em:** 
  - `supabase/functions/send-sms-bulksms/`
  - `supabase/functions/bulksms-balance/`
  - `supabase/functions/save-bulksms-credentials/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### BULKSMS_TOKEN_SECRET
- **Tipo:** Token Secret
- **Uso:** Autenticação BulkSMS API
- **Usado em:** Mesmas funções acima
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### BULKGATE_APPLICATION_ID
- **Tipo:** Application ID
- **Uso:** Autenticação BulkGate API
- **Usado em:**
  - `supabase/functions/bulkgate-test/`
  - `supabase/functions/bulkgate-balance/`
  - `supabase/functions/save-bulkgate-credentials/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

---

### 2. Pagamentos - eKwanza (12 secrets)

#### EKWANZA_ACCOUNT_NUMBER
- **Tipo:** Account Number
- **Uso:** Número da conta eKwanza
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_BASE_URL
- **Tipo:** URL
- **Uso:** Base URL da API eKwanza (Ticket/QR Code)
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Exemplo:** `ekz-partnersapi.e-kwanza.ao`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_CLIENT_ID
- **Tipo:** OAuth2 Client ID
- **Uso:** Autenticação eKwanza API
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
  - `supabase/functions/ekwanza-check-status/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_CLIENT_SECRET
- **Tipo:** OAuth2 Client Secret
- **Uso:** Autenticação eKwanza API
- **Usado em:** Mesmas funções acima
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_GPO_API_KEY
- **Tipo:** API Key
- **Uso:** API Key para MCX Express (GPO)
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_GPO_PAYMENT_METHOD
- **Tipo:** String
- **Uso:** Identificador do método de pagamento GPO
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Exemplo:** `MCX_EXPRESS` ou similar
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_GPR_API_KEY
- **Tipo:** API Key
- **Uso:** API Key para outro método de pagamento
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_MERCHANT_NUMBER
- **Tipo:** Merchant Number
- **Uso:** Número de merchant eKwanza
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_NOTIFICATION_TOKEN
- **Tipo:** Token
- **Uso:** Token para notificações/webhooks eKwanza
- **Usado em:**
  - `supabase/functions/ekwanza-webhook/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_OAUTH_URL
- **Tipo:** URL
- **Uso:** URL OAuth2 para autenticação (MCX/REF)
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Exemplo:** `https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_REF_PAYMENT_METHOD
- **Tipo:** String
- **Uso:** Identificador do método de pagamento Referência EMIS
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Exemplo:** `REFERENCIA_EMIS` ou similar
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### EKWANZA_RESOURCE
- **Tipo:** String
- **Uso:** Resource identifier para OAuth2
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### ENABLE_REFERENCIA_EMIS
- **Tipo:** Boolean
- **Uso:** Flag para ativar/desativar Referência EMIS
- **Usado em:**
  - `supabase/functions/ekwanza-create-payment/`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Exemplo:** `true` ou `false`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

---

### 3. Supabase (1 secret - será mantido)

#### SUPABASE_SERVICE_ROLE_KEY
- **Tipo:** JWT Token (admin)
- **Uso:** Edge Functions com permissões elevadas
- **Usado em:** Todas as Edge Functions
- **Valor atual:** `[JÁ CONFIGURADO NO SUPABASE]`
- **Novo valor Lovable Cloud:** `[SERÁ GERADO AUTOMATICAMENTE PELO LOVABLE CLOUD]`
- **⚠️ NOTA:** Este secret é gerido automaticamente pelo Lovable Cloud e disponibilizado como variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` nas Edge Functions

**NOTA IMPORTANTE:** 
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` não são secrets no sentido tradicional
- São configurados diretamente em `.env` e `src/integrations/supabase/client.ts`
- Serão fornecidos automaticamente pelo Lovable Cloud após ativação

---

### 4. Email/SMTP (5 secrets necessários)

**⚠️ CONFIGURAÇÃO NECESSÁRIA:** O sistema precisa de envio de emails.

#### SMTP_HOST
- **Tipo:** String (hostname)
- **Uso:** Servidor SMTP para envio de emails
- **Usado em:**
  - `supabase/functions/send-confirmation-email/`
  - `supabase/functions/confirm-email/`
- **Valor atual:** `[PREENCHER - ex: smtp.gmail.com, smtp.sendgrid.net]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### SMTP_PORT
- **Tipo:** Number
- **Uso:** Porta do servidor SMTP
- **Usado em:** Mesmas funções acima
- **Valor atual:** `[PREENCHER - ex: 587 (TLS) ou 465 (SSL)]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### SMTP_USER
- **Tipo:** String (email ou username)
- **Uso:** Username para autenticação SMTP
- **Usado em:** Mesmas funções acima
- **Valor atual:** `[PREENCHER - ex: seu@email.com]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

#### SMTP_PASSWORD
- **Tipo:** String (password ou app password)
- **Uso:** Password para autenticação SMTP
- **Usado em:** Mesmas funções acima
- **Valor atual:** `[PREENCHER - CONFIDENCIAL]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`
- **⚠️ NOTA:** Se usar Gmail, criar App Password específica

#### SMTP_FROM_EMAIL
- **Tipo:** String (email)
- **Uso:** Email do remetente
- **Usado em:** Mesmas funções acima
- **Valor atual:** `[PREENCHER - ex: noreply@seudominio.com]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`

**Providers SMTP Recomendados:**
- **SendGrid** (gratuito até 100 emails/dia): https://sendgrid.com/
- **Gmail** (com App Password): https://myaccount.google.com/apppasswords
- **Mailgun** (gratuito até 5000 emails/mês): https://www.mailgun.com/
- **Resend** (gratuito até 3000 emails/mês): https://resend.com/

**Como obter credenciais SMTP:**
1. Escolher provider acima
2. Criar conta e verificar domínio (se aplicável)
3. Gerar API Key ou App Password
4. Preencher valores acima


---

### 5. Segurança (1 secret)

#### OTP_PEPPER
- **Tipo:** Salt/Secret
- **Uso:** Hash adicional para OTPs (segurança)
- **Usado em:**
  - `supabase/functions/send-otp/`
  - `supabase/functions/verify-otp/`
  - Função PostgreSQL `hash_otp_code()`
- **Valor atual:** `[PREENCHER MANUALMENTE]`
- **Novo valor Lovable Cloud:** `[SERÁ O MESMO]`
- **⚠️ CRÍTICO:** Mudar este valor invalida todos os OTPs existentes

---

## 📋 Checklist de Preparação

### Antes da Migração
- [ ] Preencher todos os valores atuais acima
- [ ] Verificar acesso aos sistemas externos (BulkSMS, BulkGate, eKwanza)
- [ ] Validar que todos os secrets estão corretos (testar APIs)
- [x] Decidir sobre configuração SMTP ✅ **CONFIRMADO: Necessário**
- [ ] Configurar provider SMTP (SendGrid, Gmail, Mailgun ou Resend)
- [ ] Obter credenciais SMTP (host, port, user, password, from_email)
- [ ] Criar backup seguro deste documento (NÃO no git)

### Durante a Migração
- [ ] Criar os 22 secrets no Lovable Cloud (17 anteriores + 5 SMTP, excluindo SUPABASE_SERVICE_ROLE_KEY que é automático)
- [ ] Testar conectividade com cada API externa
- [ ] Validar que Edge Functions conseguem aceder aos secrets
- [ ] Testar envio de email SMTP

### Após a Migração
- [ ] Confirmar que todos os serviços funcionam
- [ ] Testar envio de SMS (BulkSMS e BulkGate)
- [ ] Testar criação de pagamento eKwanza (Ticket, MCX Express, Referência EMIS)
- [ ] Testar envio de email (se configurado)
- [ ] Testar OTP login
- [ ] Validar webhooks externos (BulkSMS delivery, eKwanza confirmações)

---

## 🔒 Segurança

### Onde Obter os Valores Atuais

1. **Supabase Dashboard > Project Settings > Edge Functions**
   - Ver secrets configurados
   - Copiar valores (alguns podem estar mascarados)

2. **Verificar configurações atuais**
   - Alguns secrets podem estar hardcoded nas Edge Functions
   - Verificar se SMTP está realmente configurado

3. **Testar APIs**
   - Usar os valores para fazer requests de teste
   - Confirmar que funcionam antes de migrar

### Armazenamento Seguro

⚠️ **NUNCA:**
- Commitar este ficheiro com valores reais no git
- Enviar por email sem encriptação
- Guardar em ferramentas públicas (Notion, Google Docs públicos)

✅ **SEMPRE:**
- Usar password manager (1Password, Bitwarden, LastPass)
- Encriptar ficheiro se guardar localmente
- Usar canais seguros de comunicação (Signal, WhatsApp)
- Apagar valores temporários após migração

---

## 📞 Contactos para Obter Secrets

### SMS Gateways
- **BulkSMS**: support@bulksms.com
- **BulkGate**: support@bulkgate.com

### Pagamentos
- **eKwanza**: ekwanzapartnersao@e-kwanza.co.ao

---

## 🔄 Script de Inserção no Lovable Cloud

Após ativar Lovable Cloud, usar este template para inserir secrets:

```bash
# Exemplo - ajustar conforme interface do Lovable Cloud

# SMS Gateways
lovable secrets:set BULKSMS_TOKEN_ID="[VALOR]"
lovable secrets:set BULKSMS_TOKEN_SECRET="[VALOR]"
lovable secrets:set BULKGATE_API_KEY="[VALOR]"
lovable secrets:set BULKGATE_APPLICATION_ID="[VALOR]"

# eKwanza - Básico
lovable secrets:set EKWANZA_CLIENT_ID="[VALOR]"
lovable secrets:set EKWANZA_CLIENT_SECRET="[VALOR]"
lovable secrets:set EKWANZA_ACCOUNT_NUMBER="[VALOR]"
lovable secrets:set EKWANZA_MERCHANT_NUMBER="[VALOR]"
lovable secrets:set EKWANZA_NOTIFICATION_TOKEN="[VALOR]"

# eKwanza - URLs e Recursos
lovable secrets:set EKWANZA_BASE_URL="[VALOR]"
lovable secrets:set EKWANZA_OAUTH_URL="[VALOR]"
lovable secrets:set EKWANZA_RESOURCE="[VALOR]"

# eKwanza - Métodos de Pagamento
lovable secrets:set EKWANZA_GPO_API_KEY="[VALOR]"
lovable secrets:set EKWANZA_GPO_PAYMENT_METHOD="[VALOR]"
lovable secrets:set EKWANZA_GPR_API_KEY="[VALOR]"
lovable secrets:set EKWANZA_REF_PAYMENT_METHOD="[VALOR]"
lovable secrets:set ENABLE_REFERENCIA_EMIS="[VALOR]"

# Segurança
lovable secrets:set OTP_PEPPER="[VALOR]"

# SMTP / Email (se configurado)
lovable secrets:set SMTP_HOST="[VALOR]"
lovable secrets:set SMTP_PORT="[VALOR]"
lovable secrets:set SMTP_USER="[VALOR]"
lovable secrets:set SMTP_PASSWORD="[VALOR]"
lovable secrets:set SMTP_FROM_EMAIL="[VALOR]"

# Supabase (geridos automaticamente pelo Lovable Cloud)
# SUPABASE_SERVICE_ROLE_KEY - criado automaticamente
# SUPABASE_URL - fornecido no dashboard
# SUPABASE_ANON_KEY - fornecido no dashboard
```

---

**Última atualização:** 2025-11-27
**Status:** Template criado - valores a preencher manualmente
