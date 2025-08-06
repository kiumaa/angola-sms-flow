# BulkSMS - Especificação para Produção

Este documento detalha o processo completo para migrar o BulkSMS da Legacy EAPI para a API v1 moderna em produção.

## 1. Credenciais de Produção

### 1.1 Configuração de Variáveis de Ambiente

No painel Supabase → Settings → Edge Functions → Environment Variables:

```bash
BULKSMS_TOKEN_ID=F3F6606E497344F5A0DE5CD616AF8883-02-A
BULKSMS_TOKEN_SECRET=  # Deixar vazio para autenticação por API Token apenas
BULKSMS_ENV=production
```

### 1.2 Validação das Credenciais

Para validar o token de produção:

```bash
curl -X GET "https://api.bulksms.com/v1/profile" \
  -H "Authorization: Basic $(echo -n 'F3F6606E497344F5A0DE5CD616AF8883-02-A:' | base64)"
```

**Resposta esperada:**
```json
{
  "credits": {
    "balance": 1000
  },
  "company": "SMS Angola",
  "currency": "USD"
}
```

## 2. Migração do Endpoint de Envio

### 2.1 Novo Endpoint API v1

**Substituir:** `https://api-legacy2.bulksms.com/eapi`  
**Por:** `https://api.bulksms.com/v1/messages`

### 2.2 Formato da Requisição

```http
POST https://api.bulksms.com/v1/messages
Authorization: Basic RjNGNjYwNkU0OTczNDRGNUEwREU1Q0Q2MTZBRTU4ODMtMDItQTo=
Content-Type: application/json

{
  "messages": [
    {
      "to": "+244912345678",
      "body": "Sua mensagem aqui",
      "from": "SMSAO"
    }
  ]
}
```

### 2.3 Resposta da API v1

**Sucesso (201 Created):**
```json
[
  {
    "id": "u4MKyAwPqp0.32938949029384903",
    "type": "text",
    "from": "SMSAO",
    "to": "+244912345678",
    "body": "Sua mensagem aqui",
    "status": {
      "type": "SENT",
      "subtype": "SENT",
      "description": "Message sent successfully"
    }
  }
]
```

**Erro (400 Bad Request):**
```json
{
  "detail": {
    "message": "Unauthorized sender ID",
    "code": "INVALID_SENDER"
  }
}
```

## 3. Atualização do Edge Function

### 3.1 Função sendViaBulkSMSProduction

```typescript
async function sendViaBulkSMSProduction(
  contacts: string[],
  message: string,
  senderId: string,
  apiToken: string,
  isTest: boolean = false
): Promise<BulkSMSResponse[]> {
  
  // Format phone numbers for Angola (+244)
  const formattedContacts = contacts.map(contact => {
    if (!contact.startsWith('+244') && !contact.startsWith('244')) {
      return `+244${contact.replace(/^0+/, '')}`
    }
    return contact.startsWith('+') ? contact : `+${contact}`
  })

  const results: BulkSMSResponse[] = []

  try {
    // Prepare messages array for API v1
    const messages = formattedContacts.map(to => ({
      to,
      body: message,
      from: senderId
    }))

    const payload = { messages }

    console.log(`Sending ${formattedContacts.length} SMS via BulkSMS API v1 with sender: ${senderId}`)

    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${apiToken}:`)}`
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()
    console.log('BulkSMS API v1 response:', responseData)

    if (response.ok && Array.isArray(responseData)) {
      // Process successful responses
      responseData.forEach((item, index) => {
        const contact = formattedContacts[index]
        const success = item.status?.type === 'SENT'
        
        results.push({
          success,
          to: contact,
          messageId: success ? item.id : undefined,
          error: success ? undefined : item.status?.description || 'Unknown error'
        })
      })
    } else {
      // Handle API errors
      const errorMessage = responseData.detail?.message || `HTTP ${response.status}`
      formattedContacts.forEach(contact => {
        results.push({
          success: false,
          to: contact,
          error: errorMessage
        })
      })
    }

  } catch (error) {
    console.error(`Error sending SMS via BulkSMS API v1:`, error)
    
    // Create error responses for all contacts
    formattedContacts.forEach(contact => {
      results.push({
        success: false,
        to: contact,
        error: error.message
      })
    })
  }

  return results
}
```

### 3.2 Interface de Resposta

```typescript
interface BulkSMSResponse {
  success: boolean
  to: string
  messageId?: string
  error?: string
}
```

## 4. Configuração do Webhook

### 4.1 Configuração no BulkSMS Console

1. Acesse: **BulkSMS Console → Settings → Webhooks**
2. Clique em **"Add Webhook"**
3. Configure:
   - **Type:** Delivery Reports
   - **URL:** `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulksms-delivery-webhook`
   - **Method:** POST
   - **Content-Type:** application/json
   - **Events:** MESSAGE_SENT, MESSAGE_DELIVERED, MESSAGE_FAILED

### 4.2 Payload do Webhook

O BulkSMS enviará delivery reports neste formato:

```json
{
  "id": "u4MKyAwPqp0.32938949029384903",
  "type": "DELIVERY_REPORT",
  "submission": {
    "date": "2025-01-20T10:30:00.000Z",
    "to": "+244912345678",
    "from": "SMSAO"
  },
  "status": {
    "type": "DELIVERED",
    "subtype": "DELIVERED_TO_HANDSET",
    "description": "Message delivered to handset"
  },
  "detail": {
    "message": "Message delivered successfully",
    "code": "DELIVERED"
  }
}
```

### 4.3 Atualização do Webhook Handler

```typescript
// Em bulksms-delivery-webhook/index.ts
interface DeliveryReport {
  id: string
  type: string
  submission: {
    date: string
    to: string
    from: string
  }
  status: {
    type: string
    subtype: string
    description: string
  }
  detail?: {
    message: string
    code: string
  }
}

// Mapear status BulkSMS → status interno
let internalStatus = 'sent'
switch (deliveryReport.status.type) {
  case 'DELIVERED':
    internalStatus = 'delivered'
    break
  case 'FAILED':
  case 'REJECTED':
    internalStatus = 'failed'
    break
  default:
    internalStatus = 'sent'
}
```

## 5. Sender IDs em Produção

### 5.1 Configuração no BulkSMS Console

1. Acesse: **BulkSMS Console → Settings → Sender IDs**
2. Adicione os Sender IDs aprovados:
   - `SMSAO` (padrão)
   - `SMS.AO` (alternativo)
   - Outros Sender IDs customizados aprovados

### 5.2 Validação no Sistema

```sql
-- Verificar Sender IDs aprovados
SELECT user_id, sender_id, status, supported_gateways
FROM sender_ids
WHERE status = 'approved'
AND 'bulksms' = ANY(supported_gateways);
```

### 5.3 Sincronização com BulkSMS

Criar função para validar Sender IDs diretamente na API:

```typescript
async function validateSenderIDWithBulkSMS(senderId: string, apiToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${apiToken}:`)}`
      },
      body: JSON.stringify({
        messages: [{
          to: '+244000000000', // Número de teste
          body: 'Test validation',
          from: senderId
        }]
      })
    })

    const result = await response.json()
    
    // Se retornar erro de Sender ID inválido, não está aprovado
    if (!response.ok && result.detail?.code === 'INVALID_SENDER') {
      return false
    }
    
    return true
  } catch {
    return false
  }
}
```

## 6. Testes de Produção

### 6.1 Números de Teste em Angola

```json
{
  "test_numbers": [
    "+244912345678",
    "+244923456789", 
    "+244934567890"
  ],
  "expected_results": {
    "sent": true,
    "delivered": true,
    "delivery_time": "< 30 seconds"
  }
}
```

### 6.2 Script de Teste

```bash
# Teste via curl
curl -X POST "https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/send-sms-bulksms" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": ["+244912345678"],
    "message": "Teste de produção SMS.AO via BulkSMS API v1",
    "senderId": "SMSAO",
    "isTest": false
  }'
```

### 6.3 Validação dos Logs

```sql
-- Verificar logs de SMS enviados
SELECT 
  phone_number,
  message,
  status,
  gateway_used,
  gateway_message_id,
  sent_at,
  delivered_at,
  error_message
FROM sms_logs
WHERE gateway_used = 'bulksms'
AND sent_at >= NOW() - INTERVAL '1 hour'
ORDER BY sent_at DESC;
```

## 7. Remoção do Sandbox/Legacy

### 7.1 Código a Remover

1. **Função `sendViaBulkSMSLegacy`** em `send-sms-bulksms/index.ts`
2. **Referências ao endpoint** `api-legacy2.bulksms.com/eapi`
3. **Variáveis de ambiente** `BULKSMS_SANDBOX_MODE`

### 7.2 UI de Configuração

Atualizar `AdminSMSConfiguration.tsx`:

```typescript
// Remover referências ao sandbox
<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <p className="text-sm text-green-800">
      <strong>Produção Ativa:</strong> API v1 configurada com token de produção
    </p>
  </div>
</div>

<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-800">
    <strong>Endpoint:</strong> https://api.bulksms.com/v1/messages
  </p>
</div>
```

## 8. Checklist de Produção

### 8.1 Pré-Deploy

- [ ] Token de produção configurado
- [ ] Webhook URL atualizada no BulkSMS Console
- [ ] Sender IDs aprovados no BulkSMS Console
- [ ] Edge functions atualizadas
- [ ] Código legacy removido

### 8.2 Pós-Deploy

- [ ] Teste de envio realizado com sucesso
- [ ] Delivery reports recebidos via webhook
- [ ] Logs do sistema atualizados corretamente
- [ ] Painel de monitoramento funcionando
- [ ] Créditos sendo debitados corretamente

### 8.3 Monitoramento

- [ ] Configurar alertas para falhas de envio
- [ ] Monitorar taxa de delivery
- [ ] Acompanhar consumo de créditos
- [ ] Verificar logs de erro regularmente

## 9. Rollback Plan

Em caso de problemas:

1. **Reativar Legacy EAPI** temporariamente
2. **Reverter variáveis de ambiente**
3. **Comunicar problemas ao suporte BulkSMS**
4. **Manter logs para debug**

## 10. Suporte e Documentação

- **BulkSMS API Docs:** https://www.bulksms.com/developer/json/v1/
- **Console BulkSMS:** https://www.bulksms.com/account/
- **Suporte técnico:** support@bulksms.com

---

**Data de criação:** 2025-01-20  
**Última atualização:** 2025-01-20  
**Versão:** 1.0