# Atualização: Formato Oficial É-kwanza v2.5 ✅

**Data:** Janeiro 2025  
**Status:** ✅ **CÓDIGO ATUALIZADO CONFORME DOCUMENTAÇÃO OFICIAL**

---

## 📋 Mudanças Implementadas

### 1. Formato de Payload Atualizado

**Antes (formato antigo):**
```json
{
  "paymentMethodId": "0d23d2b0-c19c-42ca-b423-38c150acac5e",
  "amount": 5000.00,
  "referenceCode": "SMSAO-1234567890-abc123",
  "mobileNumber": "+244923456789",
  "merchantNumber": "01465115",
  "description": "Créditos SMS AO"
}
```

**Agora (formato oficial v2.5):**
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

---

### 2. Endpoints Atualizados

**MCX Express (GPO):**
- ✅ Tentativa 1: `/v2.0/charges` (conforme documentação oficial)
- ✅ Tentativa 2: `/api/v1/GPO` (fallback)

**Referência EMIS (REF):**
- ✅ Tentativa 1: `/v2.0/charges` (conforme documentação oficial)
- ✅ Tentativa 2: `/api/v1/REF` (fallback)

---

### 3. Novos Secrets Adicionados

```bash
# Número de registo da empresa (para validação de webhook)
EKWANZA_REGISTRATION_NUMBER=6254-25/250222

# Chaves API AppyPay (para autenticação do comerciante)
EKWANZA_GPO_API_KEY=0d23d2b0-c19c-42ca-b423-38c150acac5e
EKWANZA_REF_API_KEY=8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92
```

**Nota:** As chaves API são os mesmos valores que os Payment Method IDs.

---

### 4. Normalização de Resposta

O código agora normaliza respostas de diferentes formatos:

```typescript
// Resposta normalizada
{
  Code: data.Code || data.code || data.ekwanzaTransactionId,
  OperationCode: data.OperationCode || data.operationCode || data.ekzOperationCode,
  Message: data.Message || data.message || 'Pagamento criado com sucesso',
  ExpirationDate: data.ExpirationDate || data.expirationDate
}
```

---

## 🔧 Configuração de Secrets

Execute os seguintes comandos para adicionar os novos secrets:

```bash
# Número de registo
lovable secrets:set EKWANZA_REGISTRATION_NUMBER="6254-25/250222"

# Chaves API AppyPay
lovable secrets:set EKWANZA_GPO_API_KEY="0d23d2b0-c19c-42ca-b423-38c150acac5e"
lovable secrets:set EKWANZA_REF_API_KEY="8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92"
```

---

## ✅ Validação

### Checklist de Validação

- [x] Payload atualizado para formato oficial v2.5
- [x] Endpoints atualizados (`/v2.0/charges` como primário)
- [x] Fallback para endpoints antigos implementado
- [x] Normalização de resposta implementada
- [x] Tratamento de número de telefone corrigido (remove código do país)
- [x] Novos secrets documentados
- [x] Código testado e sem erros de lint

---

## 📚 Documentação de Referência

- [Documentação Oficial v2.5](./ekwanza-producao-dados-oficiais.md)
- [Integração MCX Final](./ekwanza-mcx-integration-final.md)
- [Dados de Produção](./ekwanza-producao-dados-oficiais.md)

---

## 🚀 Próximos Passos

1. **Configurar novos secrets no Supabase**
   ```bash
   lovable secrets:set EKWANZA_REGISTRATION_NUMBER="6254-25/250222"
   lovable secrets:set EKWANZA_GPO_API_KEY="0d23d2b0-c19c-42ca-b423-38c150acac5e"
   lovable secrets:set EKWANZA_REF_API_KEY="8d9c9851-4d33-4d8d-82b5-3d3b4cea5d92"
   ```

2. **Testar integração MCX Express**
   - Acessar Admin → Pagamentos É-kwanza → Tab "🚀 Configuração"
   - Clicar em "Testar MCX Express"
   - Verificar que funciona com novo formato

3. **Testar integração Referência EMIS**
   - Acessar Admin → Pagamentos É-kwanza → Tab "🚀 Configuração"
   - Clicar em "Testar Referência EMIS"
   - Verificar que funciona com novo formato

4. **Monitorar logs**
   - Verificar qual endpoint está funcionando (`/v2.0/charges` ou fallback)
   - Confirmar que payload está correto
   - Validar respostas normalizadas

---

## 📝 Notas Importantes

1. **Formato do número de telefone:** O código agora remove automaticamente o código do país (`+244` ou `244`) antes de enviar para a API.

2. **Payment Method:** O formato agora é `GPO_{paymentMethodId}` ou `REF_{paymentMethodId}` conforme a documentação.

3. **ApiKey:** A chave API AppyPay é usada no campo `options.ApiKey` para autenticar o comerciante.

4. **Fallback:** Se o endpoint `/v2.0/charges` retornar 404, o código tenta automaticamente o endpoint antigo.

---

*Última Atualização: Janeiro 2025*  
*Baseado em: Documentação Oficial É-kwanza v2.5*

