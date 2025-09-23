# 🔌 API REST - SMS AO

Documentação completa da API REST para integração com sistemas externos.

## 🚀 Introdução

A API SMS AO permite integrar nossos serviços de SMS em qualquer aplicação através de endpoints RESTful seguros e confiáveis.

### Base URL
```
https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/
```

### Autenticação
Todas as requisições requerem autenticação via Bearer Token:

```bash
Authorization: Bearer YOUR_API_KEY
```

## 🔑 Autenticação

### Obter Token de API
1. Faça login na plataforma SMS AO
2. Vá para **Configurações** → **API**
3. Clique **"Gerar Nova Chave"**
4. Copie e guarde o token com segurança

### Exemplo de Autenticação
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/send-sms
```

## 📱 Envio de SMS

### Envio Simples

#### Endpoint
```
POST /send-quick-sms
```

#### Parâmetros
```json
{
  "phone": "+244912345678",
  "message": "Sua mensagem aqui",
  "sender_id": "SEUAPP"
}
```

#### Exemplo
```bash
curl -X POST \
  https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/send-quick-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+244912345678",
    "message": "Olá! Sua encomenda está pronta para retirada.",
    "sender_id": "LOJAABC"
  }'
```

#### Resposta de Sucesso
```json
{
  "success": true,
  "message_id": "msg_123456789",
  "phone": "+244912345678",
  "credits_used": 1,
  "status": "sent",
  "gateway": "bulksms"
}
```

#### Resposta de Erro
```json
{
  "success": false,
  "error": "Insufficient credits",
  "error_code": "CREDIT_001",
  "credits_available": 0
}
```

### Envio em Massa

#### Endpoint
```
POST /send-bulk-sms
```

#### Parâmetros
```json
{
  "phones": ["+244912345678", "+244923456789"],
  "message": "Mensagem para todos",
  "sender_id": "PROMO"
}
```

#### Exemplo
```bash
curl -X POST \
  https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/send-bulk-sms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phones": ["+244912345678", "+244923456789", "+244934567890"],
    "message": "Promoção especial! 50% OFF em todos os produtos.",
    "sender_id": "PROMO2025"
  }'
```

#### Resposta
```json
{
  "success": true,
  "job_id": "bulk_123456789",
  "total_recipients": 3,
  "estimated_credits": 3,
  "status": "queued"
}
```

### Envio Agendado

#### Endpoint
```
POST /send-scheduled-sms
```

#### Parâmetros
```json
{
  "phone": "+244912345678",
  "message": "Lembrete de consulta amanhã às 14h",
  "sender_id": "CLINICA",
  "schedule_at": "2025-01-25T14:00:00Z"
}
```

## 📊 Consulta de Status

### Status de SMS Individual

#### Endpoint
```
GET /sms-status/{message_id}
```

#### Exemplo
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/sms-status/msg_123456789
```

#### Resposta
```json
{
  "message_id": "msg_123456789",
  "phone": "+244912345678",
  "status": "delivered",
  "sent_at": "2025-01-24T10:30:00Z",
  "delivered_at": "2025-01-24T10:30:15Z",
  "credits_used": 1,
  "gateway": "bulksms",
  "operator": "Unitel"
}
```

### Status de Envio em Massa

#### Endpoint
```
GET /bulk-status/{job_id}
```

#### Resposta
```json
{
  "job_id": "bulk_123456789",
  "status": "completed",
  "total_recipients": 3,
  "sent": 3,
  "delivered": 2,
  "failed": 0,
  "pending": 1,
  "credits_used": 3,
  "created_at": "2025-01-24T10:00:00Z",
  "completed_at": "2025-01-24T10:05:00Z"
}
```

## 💳 Consulta de Créditos

### Saldo Atual

#### Endpoint
```
GET /credits-balance
```

#### Exemplo
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/credits-balance
```

#### Resposta
```json
{
  "credits_available": 1500,
  "credits_used_today": 25,
  "credits_used_month": 450,
  "last_purchase": "2025-01-20T15:30:00Z"
}
```

### Histórico de Transações

#### Endpoint
```
GET /credits-history?limit=10&offset=0
```

#### Resposta
```json
{
  "transactions": [
    {
      "id": "txn_123456",
      "type": "purchase",
      "credits": 5000,
      "amount_kwanza": 60000,
      "status": "approved",
      "created_at": "2025-01-20T15:30:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

## 📞 Gestão de Contatos

### Listar Contatos

#### Endpoint
```
GET /contacts?limit=50&offset=0&search=joao
```

#### Resposta
```json
{
  "contacts": [
    {
      "id": "contact_123",
      "name": "João Silva",
      "phone": "+244912345678",
      "email": "joao@empresa.ao",
      "tags": ["cliente", "vip"],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

### Adicionar Contato

#### Endpoint
```
POST /contacts
```

#### Parâmetros
```json
{
  "name": "Maria Santos",
  "phone": "+244923456789",
  "email": "maria@empresa.ao",
  "tags": ["prospect"],
  "notes": "Interessada em nossos produtos"
}
```

### Atualizar Contato

#### Endpoint
```
PUT /contacts/{contact_id}
```

#### Parâmetros
```json
{
  "name": "Maria Santos Silva",
  "tags": ["cliente", "vip"],
  "notes": "Cliente VIP desde janeiro 2025"
}
```

### Remover Contato

#### Endpoint
```
DELETE /contacts/{contact_id}
```

## 📋 Listas de Contatos

### Criar Lista

#### Endpoint
```
POST /contact-lists
```

#### Parâmetros
```json
{
  "name": "Clientes VIP",
  "description": "Lista de clientes premium",
  "contact_ids": ["contact_123", "contact_456"]
}
```

### Enviar para Lista

#### Endpoint
```
POST /send-to-list
```

#### Parâmetros
```json
{
  "list_id": "list_123",
  "message": "Oferta exclusiva para clientes VIP!",
  "sender_id": "EXCLUSIVE"
}
```

## 🔧 Webhooks

### Configurar Webhook

Para receber notificações de entrega em tempo real:

#### Endpoint de Configuração
```
POST /webhooks
```

#### Parâmetros
```json
{
  "url": "https://seu-sistema.com/webhook/sms",
  "events": ["delivered", "failed"],
  "secret": "seu_webhook_secret"
}
```

### Eventos de Webhook

#### Entrega Bem-sucedida
```json
{
  "event": "delivered",
  "message_id": "msg_123456789",
  "phone": "+244912345678",
  "delivered_at": "2025-01-24T10:30:15Z",
  "operator": "Unitel"
}
```

#### Falha na Entrega
```json
{
  "event": "failed",
  "message_id": "msg_123456789",
  "phone": "+244912345678",
  "error_code": "INVALID_NUMBER",
  "error_message": "Número inválido",
  "failed_at": "2025-01-24T10:30:15Z"
}
```

### Verificação de Webhook
Verifique a autenticidade usando o header `X-SMS-Signature`:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

## 📈 Relatórios

### Estatísticas Diárias

#### Endpoint
```
GET /stats/daily?date=2025-01-24
```

#### Resposta
```json
{
  "date": "2025-01-24",
  "sms_sent": 150,
  "sms_delivered": 145,
  "sms_failed": 5,
  "delivery_rate": 96.67,
  "credits_used": 150,
  "most_used_sender": "SEUAPP"
}
```

### Estatísticas Mensais

#### Endpoint
```
GET /stats/monthly?month=2025-01
```

#### Resposta
```json
{
  "month": "2025-01",
  "sms_sent": 4500,
  "sms_delivered": 4320,
  "sms_failed": 180,
  "delivery_rate": 96.0,
  "credits_used": 4500,
  "busiest_day": "2025-01-15",
  "operators": {
    "Unitel": 2700,
    "Africell": 1200,
    "Movicel": 600
  }
}
```

## 🚨 Códigos de Erro

### Erros de Autenticação
- `AUTH_001`: Token inválido ou expirado
- `AUTH_002`: Token não fornecido
- `AUTH_003`: Permissões insuficientes

### Erros de Créditos
- `CREDIT_001`: Créditos insuficientes
- `CREDIT_002`: Erro ao debitar créditos
- `CREDIT_003`: Conta suspensa

### Erros de SMS
- `SMS_001`: Número de telefone inválido
- `SMS_002`: Mensagem muito longa (>160 caracteres)
- `SMS_003`: Sender ID inválido
- `SMS_004`: Gateway temporariamente indisponível

### Erros de Contatos
- `CONTACT_001`: Contato não encontrado
- `CONTACT_002`: Número já existe
- `CONTACT_003`: Dados obrigatórios ausentes

### Erros de Sistema
- `SYS_001`: Erro interno do servidor
- `SYS_002`: Serviço temporariamente indisponível
- `SYS_003`: Rate limit excedido

## 🔒 Segurança

### Rate Limits
- **Envio SMS**: 100 requests/minuto
- **Consultas**: 1000 requests/minuto
- **Webhooks**: 50 requests/minuto

### Boas Práticas
1. **Armazene tokens com segurança**
2. **Use HTTPS sempre**
3. **Implemente retry com backoff**
4. **Valide webhooks**
5. **Monitore rate limits**

### Exemplo de Retry
```python
import time
import requests

def send_sms_with_retry(payload, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(
                'https://api.sms.ao/send-sms',
                json=payload,
                headers={'Authorization': f'Bearer {API_TOKEN}'}
            )
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limit
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            else:
                break
        except requests.RequestException:
            time.sleep(2 ** attempt)
    
    return None
```

## 📚 SDKs e Bibliotecas

### PHP
```bash
composer require smsao/sms-php-sdk
```

### Python
```bash
pip install smsao-python
```

### Node.js
```bash
npm install smsao-sdk
```

### Java
```xml
<dependency>
    <groupId>ao.sms</groupId>
    <artifactId>sms-java-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 📞 Suporte

Para dúvidas sobre a API:
- **Email**: api@sms.ao
- **WhatsApp**: +244 933 493 788
- **Documentação**: https://docs.sms.ao/api
- **Status**: https://status.sms.ao

---

*Mantenha seus tokens seguros e monitore o uso regularmente.*