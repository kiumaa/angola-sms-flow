# É-kwanza - Dados de Produção Oficiais ✅

**Data:** Janeiro 2025  
**Fonte:** Documentação Oficial v2.5 + Dados de Produção É-kwanza  
**Status:** ✅ **CONFIGURAÇÃO ATUALIZADA**

---

## 📋 Dados do Ambiente de Produção

### Credenciais OAuth2

```bash
# OAuth2 Configuration (Microsoft Azure)
EKWANZA_OAUTH_URL=https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token
EKWANZA_CLIENT_ID=af273fba-d170-40c6-8500-d23e5b696456
EKWANZA_CLIENT_SECRET=rgK8Q~Zhqwy73dHifQsrtsns8xCNtC3UjZH~Cajn
EKWANZA_RESOURCE=bee57785-7a19-4f1c-9c8d-aa03f2f0e333
```

**Validade:** 02/02/2099

---

### Dados do Merchant

```bash
# Merchant Information
EKWANZA_MERCHANT_NUMBER=01465115          # Nº conta
EKWANZA_REGISTRATION_NUMBER=6254-25/250222 # Nº registo da empresa
EKWANZA_NOTIFICATION_TOKEN=OUAHIVRAJTMLOZ  # Token de notificação
```

---

### Endpoints

```bash
# API Base URL
EKWANZA_BASE_URL=https://ekz-partnersapi.e-kwanza.ao

# Webhook URL (configurar na É-kwanza)
EKWANZA_WEBHOOK_URL=https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/ekwanza-webhook
```

---

### Payment Methods (GPO e REF)

```bash
# Multicaixa Express (GPO) - Gateway Principal
EKWANZA_GPO_PAYMENT_METHOD=0d23d2b0-c19c-42ca-b423-38c150acac5e
EKWANZA_GPO_API_KEY=0d23d2b0-c19c-42ca-b423-38c150acac5e  # Chave API AppyPay (GPO)

# Referência EMIS (REF)
EKWANZA_REF_PAYMENT_METHOD=8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92
EKWANZA_REF_API_KEY=8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92  # Chave API AppyPay (REF)
```

**Nota:** A Chave API AppyPay é o mesmo valor que o Payment Method ID para ambos os métodos.

---

## 🔧 Configuração Completa de Secrets (Supabase)

Execute os seguintes comandos para configurar todos os secrets:

```bash
# OAuth2
lovable secrets:set EKWANZA_OAUTH_URL="https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token"
lovable secrets:set EKWANZA_CLIENT_ID="af273fba-d170-40c6-8500-d23e5b696456"
lovable secrets:set EKWANZA_CLIENT_SECRET="rgK8Q~Zhqwy73dHifQsrtsns8xCNtC3UjZH~Cajn"
lovable secrets:set EKWANZA_RESOURCE="bee57785-7a19-4f1c-9c8d-aa03f2f0e333"

# Merchant Info
lovable secrets:set EKWANZA_MERCHANT_NUMBER="01465115"
lovable secrets:set EKWANZA_REGISTRATION_NUMBER="6254-25/250222"
lovable secrets:set EKWANZA_NOTIFICATION_TOKEN="OUAHIVRAJTMLOZ"

# API Configuration
lovable secrets:set EKWANZA_BASE_URL="https://ekz-partnersapi.e-kwanza.ao"

# Payment Methods - GPO (Multicaixa Express)
lovable secrets:set EKWANZA_GPO_PAYMENT_METHOD="0d23d2b0-c19c-42ca-b423-38c150acac5e"
lovable secrets:set EKWANZA_GPO_API_KEY="0d23d2b0-c19c-42ca-b423-38c150acac5e"

# Payment Methods - REF (Referência EMIS)
lovable secrets:set EKWANZA_REF_PAYMENT_METHOD="8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92"
lovable secrets:set EKWANZA_REF_API_KEY="8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92"

# Feature Flags
lovable secrets:set ENABLE_REFERENCIA_EMIS="true"
```

---

## 📚 Documentação Oficial - Formato de Requisição

### Gateway de Pagamentos Online (GPO) - Multicaixa Express

Conforme documentação oficial v2.5, o formato correto da requisição é:

```json
{
  "amount": 5000.00,
  "currency": "AOA",
  "description": "Créditos SMS AO",
  "merchantTransactionId": "SMSAO-1234567890-abc123",
  "paymentMethod": "GPO_0d23d2b0-c19c-42ca-b423-38c150acac5e",
  "paymentInfo": {
    "phoneNumber": "923456789"
  },
  "options": {
    "MerchantIdentifier": "01465115",
    "ApiKey": "0d23d2b0-c19c-42ca-b423-38c150acac5e"
  }
}
```

**Endpoint:** `POST /v2.0/charges` ou `/api/v1/GPO` (fallback)

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {OAuth2_TOKEN}
```

---

### Referência EMIS (REF)

```json
{
  "amount": 5000.00,
  "currency": "AOA",
  "description": "Créditos SMS AO",
  "merchantTransactionId": "SMSAO-1234567890-abc123",
  "paymentMethod": "REF_8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92",
  "options": {
    "MerchantIdentifier": "01465115",
    "ApiKey": "8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92"
  }
}
```

**Endpoint:** `POST /v2.0/charges` ou `/api/v1/REF` (fallback)

---

## 🔐 Validação de Assinatura (Webhook)

Para validar webhooks de GPO/REF, usar os seguintes campos na ordem:

1. Código (code)
2. Código da operação (operationCode)
3. Número de registo do parceiro (`6254-25/250222`)
4. Token de notificação (`OUAHIVRAJTMLOZ`)

Concatenar e cifrar com HMAC-SHA256 usando a API Key do método correspondente.

---

## ✅ Checklist de Configuração

- [x] OAuth2 configurado com credenciais de produção
- [x] Merchant Number configurado (01465115)
- [x] Registration Number adicionado (6254-25/250222)
- [x] Notification Token configurado (OUAHIVRAJTMLOZ)
- [x] GPO Payment Method configurado
- [x] GPO API Key configurado
- [x] REF Payment Method configurado
- [x] REF API Key configurado
- [x] Base URL configurado
- [x] Webhook URL configurado
- [x] Código atualizado para formato oficial v2.5

---

## 📞 Informações de Contato

**Merchant ID:** 01465115  
**Nº Registo:** 6254-25/250222  
**Token Notificação:** OUAHIVRAJTMLOZ

**Ambiente:** Produção (PRD)  
**Validade OAuth2:** 02/02/2099

---

*Última Atualização: Janeiro 2025*  
*Fonte: Documentação Oficial É-kwanza v2.5 + Dados de Produção*

