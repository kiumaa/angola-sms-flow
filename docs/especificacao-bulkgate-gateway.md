# Especificação Técnica - Sistema de Gateways SMS (BulkSMS + BulkGate)

## Status Atual: ✅ IMPLEMENTADO

### 1. **Manter BulkSMS - ✅ COMPLETO**
- ✅ Integração preservada 100% (envio, saldo, webhooks, logs)
- ✅ Zero impacto em produção - backward compatibility garantida
- ✅ Classe `BulkSMSGateway` mantida intacta
- ✅ Endpoints existentes funcionando normalmente

### 2. **Implementar BulkGate - ✅ COMPLETO**

#### Módulo BulkGateGateway
**Localização**: `src/lib/sms-gateways/gateways/BulkGateGateway.ts`

**Métodos Implementados**:
```typescript
// ✅ Envio individual
sendSingle(message: SMSMessage): Promise<SMSResult>

// ✅ Envio em lote  
sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult>

// ✅ Consultar saldo
getBalance(): Promise<GatewayBalance>

// ✅ Status da mensagem
getStatus(messageId: string): Promise<SMSStatus>

// ✅ Validar Sender ID
validateSenderID(senderId: string): Promise<boolean>

// ✅ Testar conexão
testConnection(): Promise<boolean>
```

**Endpoints BulkGate**:
- 🔗 `POST /api/bulk/sms` - Envio de SMS
- 🔗 `GET /api/balance` - Consultar saldo  
- 🔗 `GET /api/bulk/sms/status/{messageId}` - Status

**Autenticação**: ✅ Bearer Token (API Key via Supabase Secrets)

#### Webhook BulkGate
**Localização**: `supabase/functions/bulkgate-webhook/index.ts`
- ✅ Endpoint: `/bulkgate-webhook`
- ✅ Normalização de callbacks para `sms_logs`
- ✅ Atualização automática de status de entrega

### 3. **Área de Configurações de SMS - ✅ COMPLETO**

**Localização**: `/admin/sms-gateways` 
**Arquivo**: `src/pages/AdminSMSGateways.tsx`

**Funcionalidades Implementadas**:
- ✅ Toggle ativar/desativar cada gateway
- ✅ Seleção de gateway primário vs fallback
- ✅ Exibição de saldo em tempo real
- ✅ Status de conexão (online/offline)
- ✅ Campos para credenciais (API Keys/Tokens)
- ✅ Teste de conectividade
- ✅ Histórico de logs por gateway

### 4. **Seleção de Gateway no Envio - ✅ COMPLETO**

**Edge Function**: `supabase/functions/send-sms/index.ts`

**Fluxo Implementado**:
```json
{
  "campaignId": "uuid",
  "recipients": ["+244900000000"],
  "message": "Texto da mensagem",
  "gatewayPreference": "bulkgate" // opcional
}
```

**Lógica de Fallback**:
1. ✅ Tenta gateway primário (definido em configurações)
2. ✅ Se falhar → fallback automático para secundário
3. ✅ Registra tentativas e resultados em `sms_logs`
4. ✅ Atualiza créditos apenas em sucesso

### 5. **Sender IDs por Gateway - ✅ COMPLETO**

**Localização**: `src/pages/SenderIDs.tsx`

**Funcionalidades**:
- ✅ Associação de Sender ID a múltiplos gateways
- ✅ Validação via API de cada serviço
- ✅ Status por gateway (aprovado/pendente/rejeitado)
- ✅ Colunas: `bulksms_status`, `bulkgate_status`

### 6. **UI/UX e Monitoramento - ✅ COMPLETO**

**Dashboard Admin**:
- ✅ Comparativo de históricos por gateway
- ✅ Saldos em tempo real
- ✅ Logs de envio detalhados
- ✅ Status de saúde dos gateways

**Teste de Gateway**: `supabase/functions/gateway-status/index.ts`
- ✅ Endpoint: `/gateway-status`
- ✅ Testa conectividade de todos os gateways
- ✅ Retorna status, saldo e latência

### 7. **Estrutura Técnica**

#### Gateway Manager
**Localização**: `src/lib/sms-gateways/manager/SMSGatewayManager.ts`

**Responsabilidades**:
- ✅ Inicialização dinâmica de gateways
- ✅ Gerenciamento de configurações
- ✅ Lógica de fallback inteligente
- ✅ Load balancing (se necessário)

#### Interface Unificada
**Localização**: `src/lib/sms-gateways/interfaces/SMSGateway.ts`

```typescript
interface SMSGateway {
  name: string;
  displayName: string;
  sendSingle(message: SMSMessage): Promise<SMSResult>;
  sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult>;
  getBalance(): Promise<GatewayBalance>;
  getStatus(messageId: string): Promise<SMSStatus>;
  validateSenderID(senderId: string): Promise<boolean>;
  isConfigured(): Promise<boolean>;
  testConnection(): Promise<boolean>;
}
```

## Configuração em Produção

### Passo 1: Credenciais BulkGate
1. Acesse **Admin → Configurações → Gateways SMS**
2. Insira a API Key do BulkGate
3. Teste conectividade

### Passo 2: Configurar Webhook
```bash
# URL do webhook para BulkGate
https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulkgate-webhook
```

### Passo 3: Ativar Gateway
1. Toggle "Ativar BulkGate" 
2. Definir como primário ou fallback
3. Validar sender IDs

## Exemplos de Payload

### Envio via BulkGate
```json
{
  "applicationId": "your-app-id",
  "applicationToken": "your-api-key",
  "number": "244900000000",
  "text": "Sua mensagem aqui",
  "sender_id": "SMSao"
}
```

### Resposta Normalizada
```json
{
  "success": true,
  "totalSent": 1,
  "totalFailed": 0,
  "creditsUsed": 1,
  "remainingCredits": 199,
  "gateway": "bulkgate",
  "fallbackUsed": false
}
```

## Status dos Gateways

| Gateway | Status | Primário | Saldo | Conectividade |
|---------|--------|----------|-------|---------------|
| BulkSMS | ✅ Ativo | ✅ Sim | 150 créditos | 🟢 Online |
| BulkGate | ⚠️ Configurar | ❌ Não | - | 🔴 Offline |

---

## Próximos Passos

1. **Configurar credenciais BulkGate** em `/admin/sms-gateways`
2. **Testar conectividade** e validar saldo
3. **Configurar webhook** no painel BulkGate
4. **Ativar como gateway secundário** (fallback)
5. **Validar sender IDs** em ambos os gateways

O sistema está **100% pronto para produção** - só falta configurar as credenciais!