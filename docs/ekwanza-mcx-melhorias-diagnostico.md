# Melhorias de Diagnóstico MCX Express ✅

**Data:** Janeiro 2025  
**Status:** ✅ **MELHORIAS IMPLEMENTADAS**

---

## 🔧 Melhorias Implementadas

### 1. Tratamento Robusto de Respostas JSON

**Problema:** Respostas da API podem não ser JSON válido ou ter formatos diferentes.

**Solução:**
- ✅ Try-catch ao fazer parse do JSON
- ✅ Log do body da resposta antes do parse
- ✅ Validação de resposta vazia
- ✅ Suporte para múltiplos formatos de resposta

**Código:**
```typescript
try {
  const responseText = await response.text()
  console.log('📥 Response body (first 500 chars):', responseText.substring(0, 500))
  
  if (!responseText || responseText.trim() === '') {
    throw new Error('MCX_API_ERROR: Response body is empty')
  }
  
  data = JSON.parse(responseText)
} catch (parseError) {
  // Tratamento de erro de parse
}
```

---

### 2. Normalização Melhorada de Respostas

**Problema:** A API pode retornar campos em diferentes formatos (PascalCase, camelCase, etc.).

**Solução:**
- ✅ Suporte para múltiplos nomes de campos
- ✅ Normalização de respostas MCX, QR Code e REF
- ✅ Log detalhado da resposta normalizada

**Campos Suportados:**
- `Code` / `code` / `ekwanzaTransactionId` / `merchantTransactionId`
- `OperationCode` / `operationCode` / `ekzOperationCode`
- `ExpirationDate` / `expirationDate` / `expiresAt`
- `Message` / `message` / `statusMessage`

---

### 3. Validação de Resposta Antes de Salvar

**Problema:** Respostas sem código de identificação causavam erros ao salvar.

**Solução:**
- ✅ Validação obrigatória de código antes de salvar
- ✅ Rollback automático de transação em caso de erro
- ✅ Mensagem de erro clara para o usuário

**Validação:**
```typescript
if (!normalized.code) {
  // Rollback transaction
  // Retornar erro claro
}
```

---

### 4. Tratamento de Erros de Banco de Dados

**Problema:** Erros ao salvar no banco não eram tratados adequadamente.

**Solução:**
- ✅ Try-catch ao salvar no banco
- ✅ Rollback automático de transação
- ✅ Mensagem de erro específica
- ✅ Log detalhado do erro

---

### 5. Logging Detalhado

**Adicionado:**
- ✅ Log do body completo da resposta (primeiros 500 chars)
- ✅ Log da resposta parseada em JSON formatado
- ✅ Log de todos os campos normalizados
- ✅ Log de erros de parse
- ✅ Log de erros de banco de dados

---

## 🧪 Como Diagnosticar Problemas

### Passo 1: Verificar Logs do Edge Function

Acessar: Supabase Dashboard → Functions → `ekwanza-create-payment` → Logs

**Logs a procurar:**

#### ✅ Sucesso:
```
🎯 === MCX EXPRESS PAYMENT (GATEWAY PRINCIPAL) ===
📋 Configuração MCX: {...}
📱 Número de telefone formatado: {...}
📦 Payload MCX completo: {...}
🔐 Obtendo OAuth2 token...
✅ OAuth2 token obtido com sucesso
🔍 Tentando endpoint: https://ekz-partnersapi.e-kwanza.ao/v2.0/charges
📥 Response status: 200 OK
📥 Response body (first 500 chars): {...}
✅ === MCX EXPRESS PAYMENT CRIADO COM SUCESSO! ===
📊 Response keys: [...]
📊 Response data completo: {...}
🔄 Resposta normalizada: {...}
💾 Attempting to save payment to database: {...}
✅ Payment saved to database successfully: {...}
```

#### ❌ Erro de Parse JSON:
```
❌ Erro ao fazer parse do JSON: SyntaxError: Unexpected token...
error_type: 'json_parse_error'
```

#### ❌ Resposta Vazia:
```
❌ Response body está vazio
MCX_API_ERROR: Response body is empty
```

#### ❌ Sem Código na Resposta:
```
❌ Resposta da API não contém código de identificação
INVALID_RESPONSE
```

#### ❌ Erro de Banco de Dados:
```
❌ Error saving payment to database: {...}
DATABASE_ERROR
```

---

### Passo 2: Verificar Console do Navegador

Abrir Console (F12) e procurar:

```javascript
// Detalhes técnicos do erro
📊 TECHNICAL ERROR DETAILS FOR EKWANZA: {...}

// Último erro (acessível via)
window.__lastEkwanzaError
```

---

### Passo 3: Verificar Secrets Configurados

```bash
# Verificar no Supabase Dashboard → Settings → Edge Functions → Secrets
✅ EKWANZA_MERCHANT_NUMBER
✅ EKWANZA_GPO_PAYMENT_METHOD
✅ EKWANZA_GPO_API_KEY
✅ EKWANZA_OAUTH_URL
✅ EKWANZA_CLIENT_ID
✅ EKWANZA_CLIENT_SECRET
✅ EKWANZA_RESOURCE
```

---

## 📊 Códigos de Erro e Soluções

| Código | Causa | Solução |
|--------|-------|---------|
| `MCX_BAD_REQUEST` | Payload inválido | Verificar formato do número de telefone e payload |
| `MCX_UNAUTHORIZED` | Token OAuth2 inválido | Verificar credenciais OAuth2 |
| `MCX_ENDPOINT_NOT_FOUND` | Endpoint não encontrado | Verificar EKWANZA_BASE_URL |
| `MCX_NETWORK_ERROR` | Erro de rede/DNS | Verificar conectividade ou whitelist de IP |
| `MCX_TIMEOUT` | Timeout (>20s) | Tentar novamente ou verificar servidor |
| `MCX_CONFIG_MISSING` | Secrets não configurados | Configurar secrets no Supabase |
| `MCX_OAUTH_FAILED` | Falha ao obter token | Verificar credenciais OAuth2 |
| `INVALID_RESPONSE` | Resposta sem código | Verificar formato da resposta da API |
| `DATABASE_ERROR` | Erro ao salvar | Verificar logs e tentar novamente |

---

## 🔍 Checklist de Troubleshooting

Quando houver erro ao finalizar compra:

1. [ ] Verificar logs do edge function no Supabase Dashboard
2. [ ] Verificar console do navegador para detalhes técnicos
3. [ ] Verificar se todos os secrets estão configurados
4. [ ] Verificar formato do número de telefone (9 dígitos começando com 9)
5. [ ] Verificar se o payload está correto (logs mostram payload completo)
6. [ ] Verificar qual endpoint está sendo usado (v2.0/charges ou /api/v1/GPO)
7. [ ] Verificar resposta da API (logs mostram response body)
8. [ ] Verificar se a resposta foi normalizada corretamente
9. [ ] Verificar se houve erro ao salvar no banco de dados
10. [ ] Copiar detalhes técnicos do erro (botão "📋 Copiar Detalhes")

---

## 📝 Informações para Suporte

Ao reportar um erro, fornecer:

1. **Código de erro:** (ex: MCX_BAD_REQUEST)
2. **Mensagem de erro:** (mensagem exibida ao usuário)
3. **Logs do edge function:** (últimas linhas relevantes)
4. **Detalhes técnicos:** (copiar via botão "📋 Copiar Detalhes")
5. **Número de telefone usado:** (formato exato)
6. **Valor da compra:** (em AOA)
7. **Timestamp:** (data e hora do erro)

---

*Última Atualização: Janeiro 2025*  
*Status: Melhorias implementadas e prontas para uso*

