# BulkSMS - Especificação Simplificada com API Token

Esta especificação detalha a implementação simplificada do BulkSMS usando apenas API Token de produção, mantendo o sistema de Sender IDs customizados.

## 1. Autenticação via API Token

### 1.1 Configuração do Token

**API Token de Produção:**
```
F3F6606E497344F5A0DE5CD616AF8883-02-A
```

### 1.2 Header de Autenticação

Todas as requisições devem usar apenas:
```http
Authorization: Basic BASE64(API_TOKEN:)
```

**Exemplo em JavaScript:**
```javascript
const apiToken = 'F3F6606E497344F5A0DE5CD616AF8883-02-A';
const authHeader = `Basic ${btoa(`${apiToken}:`)}`;
```

### 1.3 Remoção de Credenciais Antigas

- ❌ **Remover:** username/password
- ❌ **Remover:** sandbox Legacy EAPI v2
- ❌ **Remover:** API v1 JSON endpoints
- ✅ **Manter:** Legacy EAPI com API Token apenas

## 2. Envio de SMS

### 2.1 Endpoint Legacy EAPI

**URL:** `https://api-legacy2.bulksms.com/eapi`
**Método:** POST
**Content-Type:** `application/x-www-form-urlencoded`

### 2.2 Implementação sendSingle()

```javascript
async sendSingle(to, from, message) {
  const apiToken = 'F3F6606E497344F5A0DE5CD616AF8883-02-A';
  
  const payload = new URLSearchParams({
    command: 'SEND',
    message: message,
    msisdn: to,
    sender: from,
    bulkSMSMode: '1'
  });

  const response = await fetch('https://api-legacy2.bulksms.com/eapi', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiToken}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload
  });

  const responseText = await response.text();
  
  // Resposta formato: "0: Accepted for delivery|batch_id:12345"
  const [statusCode, statusText] = responseText.split(': ', 2);
  const batchId = responseText.match(/batch_id:(\d+)/)?.[1];
  
  return {
    success: statusCode === '0',
    messageId: batchId,
    error: statusCode !== '0' ? `${statusCode}: ${statusText}` : null
  };
}
```

### 2.3 Implementação sendBulk()

```javascript
async sendBulk(contacts, from, message) {
  const apiToken = 'F3F6606E497344F5A0DE5CD616AF8883-02-A';
  
  const payload = new URLSearchParams({
    command: 'SEND',
    message: message,
    msisdn: contacts.join(','),
    sender: from,
    bulkSMSMode: '1'
  });

  const response = await fetch('https://api-legacy2.bulksms.com/eapi', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiToken}:`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload
  });

  const responseText = await response.text();
  const results = [];
  
  // Parse response lines para cada contato
  const lines = responseText.split('\n').filter(line => line.trim());
  
  contacts.forEach((contact, index) => {
    const line = lines[index] || lines[0];
    const [statusCode] = line.split(': ', 2);
    const batchId = line.match(/batch_id:(\d+)/)?.[1];
    
    results.push({
      success: statusCode === '0',
      to: contact,
      messageId: batchId,
      error: statusCode !== '0' ? line : null
    });
  });

  return results;
}
```

## 3. Manutenção do Fluxo de Sender IDs

### 3.1 Tabela sender_ids (NÃO ALTERAR)

```sql
-- Manter estrutura existente
SELECT sender_id, status, supported_gateways 
FROM sender_ids 
WHERE user_id = ? AND status = 'approved';
```

### 3.2 Validação de Sender ID

```javascript
async validateSenderID(senderId, userId) {
  // Validação interna antes do envio
  const { data, error } = await supabase
    .from('sender_ids')
    .select('sender_id, status')
    .eq('user_id', userId)
    .eq('sender_id', senderId)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    throw new Error(`Sender ID "${senderId}" não aprovado`);
  }
  
  return true;
}
```

### 3.3 Fluxo de Envio com Validação

```javascript
async sendSMS(contacts, message, senderId, userId) {
  // 1. Validar Sender ID internamente
  await this.validateSenderID(senderId, userId);
  
  // 2. Enviar via BulkSMS
  const results = await this.sendBulk(contacts, senderId, message);
  
  // 3. Registrar em sms_logs
  for (const result of results) {
    await supabase.from('sms_logs').insert({
      user_id: userId,
      phone_number: result.to,
      message: message,
      sender_id: senderId,
      gateway_used: 'bulksms',
      gateway_message_id: result.messageId,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error
    });
  }
  
  return results;
}
```

## 4. Webhook de Delivery Reports

### 4.1 Configuração no BulkSMS Console

**URL:** `https://sms.kbagency.me/api/webhooks/bulksms-delivery`
**Método:** POST
**Eventos:** MESSAGE_SENT, MESSAGE_DELIVERED, MESSAGE_FAILED

### 4.2 Payload do Webhook

```json
{
  "batch_id": "12345",
  "message_id": "msg_67890",
  "msisdn": "+244912345678",
  "status": "Delivered",
  "submitted_at": "2025-01-20T10:30:00Z",
  "completed_at": "2025-01-20T10:31:00Z"
}
```

### 4.3 Processamento do Webhook

```javascript
// supabase/functions/bulksms-delivery-webhook/index.ts
serve(async (req) => {
  const deliveryReport = await req.json();
  
  // Mapear status
  let internalStatus = 'sent';
  if (deliveryReport.status === 'Delivered') {
    internalStatus = 'delivered';
  } else if (deliveryReport.status === 'Failed') {
    internalStatus = 'failed';
  }
  
  // Atualizar sms_logs
  await supabase
    .from('sms_logs')
    .update({
      status: internalStatus,
      delivered_at: deliveryReport.completed_at,
      updated_at: new Date().toISOString()
    })
    .eq('gateway_message_id', deliveryReport.batch_id)
    .eq('gateway_used', 'bulksms');
    
  return new Response(JSON.stringify({ success: true }));
});
```

## 5. Testes e Documentação

### 5.1 Teste cURL

```bash
# Teste de envio via Legacy EAPI
curl -X POST "https://api-legacy2.bulksms.com/eapi" \
  -H "Authorization: Basic $(echo -n 'F3F6606E497344F5A0DE5CD616AF8883-02-A:' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "command=SEND&message=Teste&msisdn=+244912345678&sender=SMSAO&bulkSMSMode=1"
```

**Resposta Esperada:**
```
0: Accepted for delivery|batch_id:12345
```

### 5.2 Teste de Sender ID Aprovado

```javascript
// 1. Criar Sender ID aprovado
await supabase.from('sender_ids').insert({
  user_id: 'user-123',
  sender_id: 'MEUAPP',
  status: 'approved',
  supported_gateways: ['bulksms']
});

// 2. Testar envio
const result = await bulkSMSGateway.sendSMS(
  ['+244912345678'],
  'Mensagem de teste',
  'MEUAPP',
  'user-123'
);

// 3. Verificar logs
const logs = await supabase
  .from('sms_logs')
  .select('*')
  .eq('sender_id', 'MEUAPP')
  .order('created_at', { ascending: false });
```

### 5.3 Verificação de Delivery Reports

```bash
# Simular webhook
curl -X POST "https://sms.kbagency.me/api/webhooks/bulksms-delivery" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "12345",
    "message_id": "msg_67890",
    "msisdn": "+244912345678",
    "status": "Delivered",
    "completed_at": "2025-01-20T10:31:00Z"
  }'
```

## 6. Checklist de Implementação

### 6.1 Backend (Edge Functions)

- [ ] Atualizar `send-sms-bulksms` para usar apenas API Token
- [ ] Manter validação de Sender IDs aprovados
- [ ] Usar Legacy EAPI em vez de API v1
- [ ] Registrar corretamente em `sms_logs`
- [ ] Processar webhooks de delivery

### 6.2 Frontend (Admin Interface)

- [ ] Manter interface de aprovação de Sender IDs
- [ ] Mostrar status de envio com Sender ID usado
- [ ] Painel de créditos BulkSMS (se necessário)
- [ ] Logs detalhados de SMS enviados

### 6.3 Configuração

- [ ] Webhook configurado no BulkSMS Console
- [ ] API Token em variáveis de ambiente
- [ ] Testes de envio funcionando
- [ ] Delivery reports sendo processados

## 7. Documentação para Clientes

### 7.1 Como Funciona

1. **Cliente solicita Sender ID:** Via interface do sistema
2. **Admin aprova:** Sender ID fica com `status='approved'`
3. **Cliente envia SMS:** Sistema valida se Sender ID está aprovado
4. **BulkSMS processa:** Usando apenas API Token de autenticação
5. **Delivery reports:** Atualizados automaticamente via webhook

### 7.2 Limitações

- **Sender IDs:** Devem ser aprovados internamente primeiro
- **Autenticação:** Apenas API Token (sem credenciais de usuário)
- **Formato:** Legacy EAPI (não JSON API v1)
- **Webhook:** Obrigatório para delivery reports

---

**Versão:** 2.0 - API Token Simplificado  
**Data:** 2025-01-20  
**Compatibilidade:** BulkSMS Legacy EAPI