# Atualização: Base URL para GPO e GPR ✅

**Data:** Janeiro 2025  
**Status:** ✅ **CORREÇÕES IMPLEMENTADAS**

---

## 🔧 Mudanças Implementadas

### 1. Base URL Atualizado para GPO e GPR

**Antes:**
```typescript
const baseUrl = Deno.env.get('EKWANZA_BASE_URL') || 'https://ekz-partnersapi.e-kwanza.ao'
```

**Depois:**
```typescript
// Base URL para GPO (MCX Express) e GPR (Referências)
// Usa o domínio auth.appypay.co.ao (sem /oauth2/token)
const baseUrl = Deno.env.get('EKWANZA_BASE_URL') || 'https://login.microsoftonline.com/auth.appypay.co.ao'
```

---

### 2. Validações Removidas

**Removido:** Validações que bloqueavam o uso de `auth.appypay` como base URL, já que este é o endpoint correto para GPO e GPR.

---

### 3. QR Code Temporariamente Desabilitado

**Mudanças:**
- ✅ QR Code removido do handler principal
- ✅ QR Code comentado no componente de pagamento
- ✅ Mensagem de erro clara quando tentar usar QR Code
- ✅ Validação de mobile_number atualizada (não requer mais para qrcode)

**Código:**
```typescript
// QR Code temporariamente desabilitado - apenas MCX Express e Referências ativos
if (payment_method === 'qrcode') {
  const error: any = new Error('QR_CODE_DISABLED')
  error.technical_details = {
    method: 'qrcode',
    message: 'QR Code temporariamente desabilitado. Use MCX Express ou Referência EMIS.'
  }
  throw error
}
```

---

## 📋 Endpoints Corretos

### MCX Express (GPO)
- **Base URL:** `https://login.microsoftonline.com/auth.appypay.co.ao`
- **Endpoints:**
  - `${baseUrl}/v2.0/charges`
  - `${baseUrl}/api/v1/GPO`

### Referência EMIS (GPR)
- **Base URL:** `https://login.microsoftonline.com/auth.appypay.co.ao`
- **Endpoints:**
  - `${baseUrl}/v2.0/charges`
  - `${baseUrl}/api/v1/REF`

### QR Code É-kwanza (Desabilitado)
- **Base URL:** `https://ekz-partnersapi.e-kwanza.ao` (não usado temporariamente)

---

## 🔧 Configuração de Secrets

### Secrets Obrigatórios (Supabase)

```bash
# Base URL para GPO e GPR
EKWANZA_BASE_URL=https://login.microsoftonline.com/auth.appypay.co.ao

# OAuth2 (para obter token)
EKWANZA_OAUTH_URL=https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token
EKWANZA_CLIENT_ID=af273fba-d170-40c6-8500-d23e5b696456
EKWANZA_CLIENT_SECRET=rgK8Q~Zhqwy73dHifQsrtsns8xCNtC3UjZH~Cajn
EKWANZA_RESOURCE=bee57785-7a19-4f1c-9c8d-aa03f2f0e333

# MCX Express (GPO)
EKWANZA_MERCHANT_NUMBER=01465115
EKWANZA_GPO_PAYMENT_METHOD=0d23d2b0-c19c-42ca-b423-38c150acac5e
EKWANZA_GPO_API_KEY=0d23d2b0-c19c-42ca-b423-38c150acac5e

# Referência EMIS (GPR)
EKWANZA_REF_PAYMENT_METHOD=8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92
EKWANZA_REF_API_KEY=8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92
```

---

## ✅ Métodos de Pagamento Ativos

| Método | Status | Base URL |
|--------|--------|----------|
| **MCX Express (GPO)** | ✅ Ativo | `https://login.microsoftonline.com/auth.appypay.co.ao` |
| **Referência EMIS (GPR)** | ✅ Ativo | `https://login.microsoftonline.com/auth.appypay.co.ao` |
| **QR Code É-kwanza** | 🚫 Desabilitado | - |
| **Transferência Bancária** | ✅ Ativo | - |

---

## 🧪 Como Testar

### Teste 1: MCX Express

1. Acessar checkout
2. Selecionar MCX Express
3. Inserir número de telefone válido (9 dígitos começando com 9)
4. Confirmar pagamento
5. **Resultado Esperado:** Pagamento criado com sucesso usando endpoint correto

### Teste 2: Referência EMIS

1. Acessar checkout
2. Selecionar Referência EMIS
3. Confirmar pagamento
4. **Resultado Esperado:** Pagamento criado com sucesso usando endpoint correto

### Teste 3: QR Code (Deve Falhar)

1. Tentar usar QR Code (se ainda aparecer)
2. **Resultado Esperado:** Erro claro informando que QR Code está desabilitado

---

## 📊 Logs Esperados

### MCX Express

```
🎯 === MCX EXPRESS PAYMENT (GATEWAY PRINCIPAL) ===
📋 Configuração MCX: {
  baseUrl: "https://login.microsoftonline.com/auth.appypay.co.ao",
  ...
}
🔍 Tentando endpoint: https://login.microsoftonline.com/auth.appypay.co.ao/v2.0/charges
```

### Referência EMIS

```
🎯 === REFERÊNCIA EMIS PAYMENT ===
📋 Configuração Referência: {
  baseUrl: "https://login.microsoftonline.com/auth.appypay.co.ao",
  ...
}
🔍 Tentando endpoint: https://login.microsoftonline.com/auth.appypay.co.ao/v2.0/charges
```

---

## 🚀 Próximos Passos

1. **Configurar Secret no Supabase**
   - Atualizar `EKWANZA_BASE_URL` para `https://login.microsoftonline.com/auth.appypay.co.ao`

2. **Testar no Ambiente de Produção**
   - Fazer compra de teste com MCX Express
   - Fazer compra de teste com Referência EMIS
   - Verificar logs para confirmar endpoints corretos

3. **Monitorar**
   - Verificar se pagamentos estão sendo criados corretamente
   - Identificar se há problemas com os novos endpoints
   - Ajustar conforme necessário

---

*Última Atualização: Janeiro 2025*  
*Status: Correções implementadas e prontas para teste*

