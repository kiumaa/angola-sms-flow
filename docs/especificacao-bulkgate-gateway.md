# Especificação: Integração BulkGate como Gateway SMS Alternativo

## 1. Visão Geral

Esta especificação detalha a implementação do BulkGate como gateway SMS alternativo na plataforma, mantendo 100% de compatibilidade com a integração atual do BulkSMS.

### 1.1 Objetivos
- ✅ Manter BulkSMS funcional sem quebras
- ✅ Adicionar BulkGate como opção alternativa
- ✅ Implementar sistema de fallback automático
- ✅ Centralizar configuração de gateways no admin
- ✅ Suporte a múltiplos sender IDs por gateway

### 1.2 Requisitos Técnicos
- Zero downtime durante implementação
- Backward compatibility total
- Logs auditáveis de cada tentativa
- Interface unificada para ambos os gateways

---

## 2. Arquitetura de Gateways

### 2.1 Interface Padrão
Criar interface comum que ambos os gateways devem implementar:

```typescript
interface SMSGateway {
  name: string;
  sendSingle(to: string, from: string, message: string): Promise<SMSResult>;
  sendBulk(recipients: string[], from: string, message: string): Promise<SMSBulkResult>;
  getBalance(): Promise<number>;
  getStatus(messageId: string): Promise<SMSStatus>;
  validateSenderID(senderId: string): Promise<boolean>;
}
```

### 2.2 Estrutura de Módulos
```
src/lib/sms-gateways/
├── interfaces/
│   ├── SMSGateway.ts
│   └── SMSTypes.ts
├── gateways/
│   ├── BulkSMSGateway.ts (refatorar código atual)
│   └── BulkGateGateway.ts (novo)
├── manager/
│   └── SMSGatewayManager.ts (novo)
└── index.ts
```

### 2.3 Gateway Manager
Classe responsável por:
- Determinar gateway primário/fallback
- Executar tentativas com fallback automático
- Consolidar logs de ambos os gateways
- Gerenciar configurações ativas

---

## 3. Implementação BulkGate

### 3.1 Endpoints da API BulkGate
```
Base URL: https://api.bulkgate.com/v2.0/
Autenticação: Bearer {API_KEY}

Endpoints:
- POST /sms/send - Envio de SMS
- GET /credit/balance - Consulta saldo
- GET /sms/status/{id} - Status da mensagem
- GET /sender-id/validate/{id} - Validar sender ID
```

### 3.2 Payloads de Exemplo

**Envio Simples:**
```json
{
  "messages": [{
    "to": "+244900000000",
    "from": "SMSao",
    "text": "Sua mensagem aqui"
  }]
}
```

**Envio em Lote:**
```json
{
  "messages": [
    {"to": "+244900000001", "from": "SMSao", "text": "Mensagem 1"},
    {"to": "+244900000002", "from": "SMSao", "text": "Mensagem 2"}
  ]
}
```

### 3.3 Tratamento de Erros
- Saldo insuficiente: código 402
- Sender ID inválido: código 403
- Rate limit: código 429
- Servidor indisponível: código 5xx

---

## 4. Migrações de Banco de Dados

### 4.1 Nova Tabela: `sms_gateways`
```sql
CREATE TABLE public.sms_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'bulksms' | 'bulkgate'
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  api_endpoint TEXT NOT NULL,
  auth_type TEXT NOT NULL, -- 'basic' | 'bearer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 4.2 Atualizar Tabela: `sender_ids`
```sql
ALTER TABLE public.sender_ids 
ADD COLUMN bulksms_status TEXT DEFAULT 'pending',
ADD COLUMN bulkgate_status TEXT DEFAULT 'pending',
ADD COLUMN supported_gateways TEXT[] DEFAULT ARRAY['bulksms'];
```

### 4.3 Atualizar Tabela: `sms_logs`
```sql
ALTER TABLE public.sms_logs 
ADD COLUMN gateway_used TEXT DEFAULT 'bulksms',
ADD COLUMN gateway_message_id TEXT,
ADD COLUMN fallback_attempted BOOLEAN DEFAULT false,
ADD COLUMN original_gateway TEXT;
```

---

## 5. Configurações do Admin

### 5.1 Nova Página: `/admin/sms-gateways`

**Layout da Interface:**
```
┌─────────────────────────────────────────────┐
│ Configuração de Gateways SMS                │
├─────────────────────────────────────────────┤
│ ┌─── BulkSMS ───┐  ┌─── BulkGate ───┐      │
│ │ ● Ativo       │  │ ○ Inativo      │      │
│ │ ● Primário    │  │ ○ Fallback     │      │
│ │ Saldo: 1,250  │  │ Saldo: --      │      │
│ │ [Testar]      │  │ [Configurar]   │      │
│ └───────────────┘  └────────────────┘      │
├─────────────────────────────────────────────┤
│ Configurações Avançadas:                   │
│ ☑ Fallback automático                      │
│ ☑ Log detalhado de tentativas              │
│ Timeout (seg): [30]                        │
│ Max tentativas: [2]                        │
└─────────────────────────────────────────────┘
```

### 5.2 Campos de Configuração

**BulkSMS (existente):**
- Token ID (já configurado via secrets)
- Token Secret (já configurado via secrets)
- Status: Ativo/Inativo
- Prioridade: Primário/Fallback

**BulkGate (novo):**
- API Key (novo secret: `BULKGATE_API_KEY`)
- Status: Ativo/Inativo
- Prioridade: Primário/Fallback

### 5.3 Validações
- Apenas um gateway pode ser primário
- Pelo menos um gateway deve estar ativo
- Testar conectividade antes de salvar
- Validar formato das credenciais

---

## 6. Sistema de Sender IDs Multi-Gateway

### 6.1 Interface Atualizada

**Página: `/admin/sender-ids`**
```
┌─────────────────────────────────────────────────────────────┐
│ Sender ID: SMSao                                            │
├─────────────────────────────────────────────────────────────┤
│ BulkSMS:   ✅ Aprovado    │ BulkGate:  ⏳ Pendente         │
│ Usado em:  45 campanhas   │ Usado em:  0 campanhas         │
│ [Verificar Status]        │ [Solicitar Aprovação]          │
├─────────────────────────────────────────────────────────────┤
│ Gateways Suportados:                                        │
│ ☑ BulkSMS  ☑ BulkGate                                      │
│                                          [Salvar] [Testar] │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Funcionalidades
- Verificação automática de status via API
- Sincronização em tempo real
- Histórico de aprovações/rejeições
- Teste de envio por gateway

---

## 7. Sistema de Fallback Automático

### 7.1 Lógica de Decisão
```typescript
async function sendWithFallback(message: SMSMessage): Promise<SMSResult> {
  const primaryGateway = await getPrimaryGateway();
  const fallbackGateway = await getFallbackGateway();
  
  try {
    // Tentativa 1: Gateway primário
    const result = await primaryGateway.sendSingle(
      message.to, 
      message.from, 
      message.text
    );
    
    await logAttempt(message.id, primaryGateway.name, 'success', result);
    return result;
    
  } catch (primaryError) {
    await logAttempt(message.id, primaryGateway.name, 'failed', primaryError);
    
    if (shouldFallback(primaryError) && fallbackGateway) {
      try {
        // Tentativa 2: Gateway fallback
        const fallbackResult = await fallbackGateway.sendSingle(
          message.to, 
          message.from, 
          message.text
        );
        
        await logAttempt(message.id, fallbackGateway.name, 'success', fallbackResult, true);
        return fallbackResult;
        
      } catch (fallbackError) {
        await logAttempt(message.id, fallbackGateway.name, 'failed', fallbackError, true);
        throw fallbackError;
      }
    }
    
    throw primaryError;
  }
}
```

### 7.2 Critérios para Fallback
- Saldo insuficiente (código 402)
- Sender ID não aprovado (código 403)
- Timeout de conexão
- Erro de servidor (5xx)
- Rate limiting (429)

### 7.3 Critérios para NÃO Fazer Fallback
- Número inválido (400)
- Mensagem muito longa (413)
- Credenciais inválidas (401)

---

## 8. Webhooks de Entrega

### 8.1 Endpoint BulkGate
**Rota:** `POST /api/webhooks/bulkgate`

**Payload Esperado:**
```json
{
  "id": "msg_123456",
  "status": "delivered", // delivered, failed, pending
  "delivered_at": "2024-01-15T10:30:00Z",
  "error_code": null,
  "error_message": null,
  "to": "+244900000000"
}
```

### 8.2 Normalização de Status
Mapear status de ambos os gateways para padrão interno:

**BulkSMS → Interno:**
- `1` → `sent`
- `8` → `delivered`
- `16` → `failed`

**BulkGate → Interno:**
- `delivered` → `delivered`
- `failed` → `failed`
- `pending` → `sent`

### 8.3 Endpoint Unificado
Manter webhook atual do BulkSMS e criar novo para BulkGate, ambos atualizando a mesma tabela `sms_logs`.

---

## 9. Edge Functions

### 9.1 Atualizar `send-sms/index.ts`
Refatorar para usar o Gateway Manager:

```typescript
// Substituir lógica atual por:
import { SMSGatewayManager } from '../lib/sms-gateways/manager/SMSGatewayManager.ts';

const gatewayManager = new SMSGatewayManager();
const result = await gatewayManager.sendWithFallback({
  to: phoneNumber,
  from: senderId,
  text: message,
  campaignId
});
```

### 9.2 Nova Function: `webhook-bulkgate/index.ts`
```typescript
serve(async (req) => {
  const payload = await req.json();
  
  // Verificar assinatura do webhook
  // Normalizar status
  // Atualizar sms_logs
  // Retornar confirmação
});
```

### 9.3 Nova Function: `gateway-status/index.ts`
Para consultar saldo e status em tempo real:
```typescript
serve(async (req) => {
  const { gateway } = await req.json();
  
  const manager = new SMSGatewayManager();
  const balance = await manager.getGatewayBalance(gateway);
  const status = await manager.getGatewayStatus(gateway);
  
  return new Response(JSON.stringify({ balance, status }));
});
```

---

## 10. Secrets Configuration

### 10.1 Novos Secrets Necessários
- `BULKGATE_API_KEY` - Token de autenticação BulkGate
- `BULKGATE_WEBHOOK_SECRET` - Para validar webhooks (opcional)

### 10.2 Secrets Existentes (manter)
- `BULKSMS_TOKEN_ID`
- `BULKSMS_TOKEN_SECRET`

---

## 11. Interface de Usuário

### 11.1 Dashboard Comparativo
**Página: `/admin/reports/gateways`**

```
┌─────────────────────────────────────────────────────────────┐
│ Relatório de Gateways - Últimos 30 dias                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─── BulkSMS ───┐              ┌─── BulkGate ───┐          │
│ │ Enviados: 1,245│              │ Enviados: 0    │          │
│ │ Entregues: 1,180│             │ Entregues: 0   │          │
│ │ Falharam: 65   │              │ Falharam: 0    │          │
│ │ Taxa: 94.8%    │              │ Taxa: --       │          │
│ │ Custo: $124.50 │              │ Custo: $0.00   │          │
│ └───────────────┘              └────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│ Fallbacks Executados: 0                                    │
│ Tempo Médio de Entrega: 2.3s                              │
│ [Exportar Relatório] [Configurar Alertas]                 │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Logs Detalhados
Adicionar coluna "Gateway" na tabela de logs de SMS para mostrar qual gateway foi usado.

### 11.3 Alertas
- Saldo baixo em qualquer gateway
- Alta taxa de falha em gateway específico
- Fallbacks frequentes

---

## 12. Testes Automatizados

### 12.1 Testes de Unidade
```typescript
describe('SMSGatewayManager', () => {
  test('should send via primary gateway', async () => {
    // Mock BulkSMS success
    // Verify BulkSMS called, BulkGate not called
  });

  test('should fallback to secondary gateway', async () => {
    // Mock BulkSMS failure
    // Mock BulkGate success
    // Verify both called in order
  });

  test('should not fallback on invalid number', async () => {
    // Mock BulkSMS 400 error
    // Verify BulkGate not called
  });
});
```

### 12.2 Testes de Integração
- Envio real para números de teste
- Verificação de webhooks
- Consulta de saldo em ambos os gateways
- Validação de sender IDs

### 12.3 Testes de Carga
- 1000 SMS simultâneos
- Distribuição entre gateways
- Tempo de resposta com fallback

---

## 13. Rollout e Deploy

### 13.1 Fase 1: Staging (Semana 1)
1. Deploy das migrações de DB
2. Implementar módulos base
3. Configurar BulkGate em staging
4. Testes manuais completos

### 13.2 Fase 2: Produção Passiva (Semana 2)
1. Deploy em produção com BulkGate inativo
2. Verificar que BulkSMS continua funcionando
3. Configurar credenciais BulkGate em produção
4. Testes de conectividade

### 13.3 Fase 3: Ativação Gradual (Semana 3)
1. Ativar BulkGate como fallback apenas
2. Monitorar logs por 48h
3. Forçar alguns fallbacks para testes
4. Validar webhooks e atualizações de status

### 13.4 Fase 4: Produção Completa (Semana 4)
1. Permitir configuração de BulkGate como primário
2. Documentação para clientes
3. Treinamento da equipe de suporte
4. Métricas e alertas ativos

---

## 14. Documentação

### 14.1 Para Desenvolvedores
- README com setup local
- Diagramas de arquitetura
- Exemplos de payload de cada gateway
- Troubleshooting comum

### 14.2 Para Administradores
- Guia de configuração passo a passo
- Como interpretar logs e métricas
- Procedimentos de emergência
- Contatos de suporte dos gateways

### 14.3 Para Clientes
- Anúncio de nova funcionalidade
- Benefícios do sistema de fallback
- Garantias de compatibilidade
- Canal de feedback

---

## 15. Monitoramento e Alertas

### 15.1 Métricas Principais
- Taxa de sucesso por gateway
- Tempo médio de entrega
- Frequência de fallbacks
- Saldo restante
- Errors por tipo

### 15.2 Alertas Críticos
- Gateway primário indisponível > 5min
- Taxa de fallback > 20%
- Saldo < 100 SMS em qualquer gateway
- Webhook não recebido > 1h

### 15.3 Dashboard Executivo
- Visão consolidada de ambos os gateways
- KPIs de entregabilidade
- Projeção de custos
- Recomendações automáticas

---

## 16. Considerações de Segurança

### 16.1 Autenticação
- API keys em Supabase Secrets
- Rotação automática de tokens
- Logs de acesso às credenciais

### 16.2 Webhooks
- Validação de assinatura
- Rate limiting
- IP whitelist quando possível

### 16.3 Auditoria
- Log de todas as mudanças de configuração
- Rastreamento de quem ativou/desativou gateways
- Histórico de credenciais alteradas

---

## 17. Cronograma Resumido

| Semana | Milestone | Entregáveis |
|--------|-----------|-------------|
| 1 | Base Implementation | Interface, Gateways, Migrações |
| 2 | Admin UI | Configurações, Sender IDs, Testes |
| 3 | Edge Functions | Manager, Webhooks, Fallback |
| 4 | Testing & Polish | Testes automatizados, UI final |
| 5 | Staging Deploy | Deploy completo em staging |
| 6 | Production Deploy | Deploy gradual em produção |

---

## 18. Critérios de Aceitação

### 18.1 Funcional
- ✅ BulkSMS continua funcionando sem alterações
- ✅ BulkGate envia SMS corretamente
- ✅ Fallback automático funciona
- ✅ Webhooks atualizam status
- ✅ Interface admin completa

### 18.2 Performance
- ✅ Tempo de resposta < 3s para envios
- ✅ Fallback executado em < 5s
- ✅ Suporte a 1000+ SMS simultâneos

### 18.3 Segurança
- ✅ Credenciais protegidas
- ✅ Webhooks validados
- ✅ Logs auditáveis

### 18.4 Usabilidade
- ✅ Interface intuitiva
- ✅ Configuração em < 5 minutos
- ✅ Troubleshooting claro

---

Esta especificação garante uma implementação robusta e sem riscos, mantendo a compatibilidade total com o sistema atual enquanto adiciona flexibilidade e confiabilidade com o novo gateway BulkGate.