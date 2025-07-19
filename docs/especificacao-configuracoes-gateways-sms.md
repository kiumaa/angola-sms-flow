# Especificação: Página Configurações → Gateways SMS Unificada

## 1. Visão Geral da Página

### Layout Principal
- **Página**: `/admin/sms-gateways` (já existente, será atualizada)
- **Título**: "Configurações de Gateways SMS"
- **Subtítulo**: "Gerencie provedores BulkSMS e BulkGate de forma unificada"

### Dashboard de Status (Topo da Página)
```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD DE GATEWAYS                    │
├──────────────────────────┬──────────────────────────────────┤
│        BulkSMS          │           BulkGate              │
├──────────────────────────┼──────────────────────────────────┤
│ 🟢 Conectado            │ 🔴 Desconectado                 │
│ 1,247 SMS Enviados      │ 0 SMS Enviados                  │
│ 98.3% Taxa de Sucesso   │ - Taxa de Sucesso               │
│ 450 Créditos Restantes  │ - Créditos Restantes            │
└──────────────────────────┴──────────────────────────────────┘
```

## 2. Seção de Configuração Global

### Controle de Gateway Ativo
```
┌─────────────────────────────────────────────────────────────┐
│                 CONFIGURAÇÃO GLOBAL                         │
├─────────────────────────────────────────────────────────────┤
│ Gateway Primário: ( ) BulkSMS  (•) BulkGate               │
│ ☑ Usar fallback automático                                │
│ Logs de Fallback: 12 envios reenviados via BulkGate      │
└─────────────────────────────────────────────────────────────┘
```

## 3. Seção de Configuração BulkSMS (Atual - Manter)

### Campos Existentes
```json
{
  "bulksms_endpoint": "https://api.bulksms.com/v1/messages",
  "bulksms_token_id": "****-****-****-1234",
  "bulksms_token_secret": "****-****-****-5678",
  "bulksms_cost_per_sms": 0.05,
  "bulksms_default_sender": "EMPRESA",
  "bulksms_message_format": "text"
}
```

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO BULKSMS                     │
├─────────────────────────────────────────────────────────────┤
│ Status: 🟢 Ativo (Primário)                                │
│                                                             │
│ Endpoint API: [https://api.bulksms.com/v1/messages......] │
│ Token ID:     [****-****-****-1234........................] │
│ Token Secret: [****-****-****-5678........................] │
│ Custo/SMS:    [0.05..] AOA                                 │
│ Sender ID:    [EMPRESA...................................]  │
│ Formato:      [Text ▼]                                     │
│                                                             │
│ [Testar Conexão]  [Salvar Configurações]                  │
└─────────────────────────────────────────────────────────────┘
```

## 4. Nova Seção de Configuração BulkGate

### Campos Necessários
```json
{
  "bulkgate_endpoint": "https://api.bulkgate.com/v2.0/sms",
  "bulkgate_api_key": "****-****-****-abcd",
  "bulkgate_cost_per_sms": 0.04,
  "bulkgate_default_sender": "EMPRESA",
  "bulkgate_webhook_url": "https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulkgate-webhook"
}
```

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│                   CONFIGURAÇÃO BULKGATE                     │
├─────────────────────────────────────────────────────────────┤
│ Status: 🔴 Inativo (Secundário)                            │
│                                                             │
│ Endpoint API: [https://api.bulkgate.com/v2.0/sms.........] │
│ API Key:      [****-****-****-abcd........................] │
│ Custo/SMS:    [0.04..] AOA                                 │
│ Sender ID:    [EMPRESA...................................]  │
│ Webhook URL:  [https://...functions/v1/bulkgate-webhook..] │
│                                                             │
│ [Testar Conexão]  [Salvar Configurações]                  │
└─────────────────────────────────────────────────────────────┘
```

## 5. Seleção de Gateway Ativo

### Controles de Interface
- **Radio Buttons**: Seleção exclusiva do gateway primário
- **Toggle Switch**: Ativação/desativação individual de cada gateway
- **Dropdown**: Alternativa para seleção de gateway primário

### Estados Possíveis
1. **Apenas BulkSMS Ativo**: Padrão atual
2. **Apenas BulkGate Ativo**: Nova opção
3. **BulkSMS Primário + BulkGate Fallback**: Recomendado
4. **BulkGate Primário + BulkSMS Fallback**: Alternativa

## 6. Fallback Automático

### Configuração
```json
{
  "fallback_enabled": true,
  "fallback_triggers": [
    "insufficient_balance",
    "sender_id_rejected",
    "api_timeout",
    "rate_limit_exceeded"
  ],
  "max_fallback_attempts": 1
}
```

### Logs de Fallback
- Contador de tentativas de fallback
- Último fallback realizado (timestamp)
- Motivo do fallback (saldo, erro API, etc.)

## 7. Estatísticas e Logs

### Métricas por Gateway
```
┌─────────────────────────────────────────────────────────────┐
│                     ESTATÍSTICAS                            │
├──────────────────────────┬──────────────────────────────────┤
│        BulkSMS          │           BulkGate              │
├──────────────────────────┼──────────────────────────────────┤
│ Total Enviados: 1,247    │ Total Enviados: 0               │
│ Sucessos: 1,224 (98.3%)  │ Sucessos: 0 (-)                │
│ Falhas: 23 (1.7%)        │ Falhas: 0 (-)                  │
│ Créditos Usados: 62.35   │ Créditos Usados: 0.00          │
│ Último Envio: 2h atrás   │ Último Envio: Nunca            │
└──────────────────────────┴──────────────────────────────────┘
```

### Gráfico de Histórico
- **Últimos 30 dias**: Volume de envios por gateway
- **Linhas de tendência**: Sucessos vs. falhas
- **Indicadores de custo**: Gastos por gateway

## 8. UI/UX e Responsividade

### Layout Responsivo
```css
/* Desktop */
.gateway-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

/* Mobile */
@media (max-width: 768px) {
  .gateway-config {
    grid-template-columns: 1fr;
  }
}
```

### Feedback Visual
- **Toast Notifications**: Sucessos e erros em tempo real
- **Loading States**: Spinners durante testes de conexão
- **Status Indicators**: Cores e ícones para status de gateway
- **Progress Bars**: Para testes de envio em andamento

### Cores e Indicadores
```css
/* Status Colors */
--status-active: hsl(142, 76%, 36%);    /* Verde */
--status-inactive: hsl(0, 84%, 60%);    /* Vermelho */
--status-warning: hsl(38, 92%, 50%);    /* Amarelo */
--status-testing: hsl(217, 91%, 60%);   /* Azul */
```

## 9. Testes de Conexão

### Payload para BulkSMS
```json
{
  "to": "+244900000000",
  "from": "TEST",
  "body": "Teste de conexão BulkSMS - SMS Marketing Angola",
  "encoding": "TEXT"
}
```

### Payload para BulkGate
```json
{
  "number": "+244900000000",
  "text": "Teste de conexão BulkGate - SMS Marketing Angola",
  "sender_id": "TEST",
  "unicode": false
}
```

### Validações de Teste
1. **Conectividade**: Ping ao endpoint da API
2. **Autenticação**: Validação de credenciais
3. **Saldo**: Verificação de créditos disponíveis
4. **Envio**: SMS de teste para número configurado

## 10. Implementação por Componentes

### Estrutura de Arquivos
```
src/pages/AdminSMSGateways.tsx (atualizar existente)
├── components/
│   ├── GatewayDashboard.tsx (novo)
│   ├── BulkSMSConfig.tsx (refatorar existente)
│   ├── BulkGateConfig.tsx (novo)
│   ├── GatewaySelector.tsx (novo)
│   ├── FallbackConfig.tsx (novo)
│   └── GatewayStats.tsx (novo)
```

### Estados do Componente
```typescript
interface GatewayState {
  bulksms: {
    enabled: boolean;
    configured: boolean;
    connected: boolean;
    balance: number;
    lastTest: Date | null;
  };
  bulkgate: {
    enabled: boolean;
    configured: boolean;
    connected: boolean;
    balance: number;
    lastTest: Date | null;
  };
  primary: 'bulksms' | 'bulkgate';
  fallbackEnabled: boolean;
  testing: boolean;
}
```

## 11. Exemplos de Payload JSON

### Configuração Completa
```json
{
  "gateway_settings": {
    "primary": "bulksms",
    "fallback_enabled": true,
    "bulksms": {
      "enabled": true,
      "endpoint": "https://api.bulksms.com/v1/messages",
      "token_id": "your-token-id",
      "token_secret": "your-token-secret",
      "cost_per_sms": 0.05,
      "default_sender": "EMPRESA"
    },
    "bulkgate": {
      "enabled": true,
      "endpoint": "https://api.bulkgate.com/v2.0/sms",
      "api_key": "your-api-key",
      "cost_per_sms": 0.04,
      "default_sender": "EMPRESA",
      "webhook_url": "https://your-domain.com/webhooks/bulkgate"
    }
  }
}
```

## 12. Testes Automatizados

### Cenários de Teste
1. **Configuração de Gateway**
   - Salvar configurações BulkSMS
   - Salvar configurações BulkGate
   - Validar campos obrigatórios

2. **Testes de Conexão**
   - Teste bem-sucedido BulkSMS
   - Teste bem-sucedido BulkGate
   - Teste com credenciais inválidas

3. **Seleção de Gateway**
   - Alterar gateway primário
   - Ativar/desativar fallback
   - Validar estado da interface

4. **Comportamento de Fallback**
   - Simular falha no gateway primário
   - Verificar envio via gateway secundário
   - Registrar logs de fallback

### Estrutura de Testes
```typescript
describe('AdminSMSGateways', () => {
  describe('Gateway Configuration', () => {
    it('should save BulkSMS settings');
    it('should save BulkGate settings');
    it('should validate required fields');
  });
  
  describe('Connection Testing', () => {
    it('should test BulkSMS connection');
    it('should test BulkGate connection');
    it('should handle connection failures');
  });
  
  describe('Gateway Selection', () => {
    it('should set primary gateway');
    it('should enable fallback');
    it('should update UI state');
  });
});
```

## 13. Cronograma de Implementação

### Fase 1: Estrutura Base (1-2 dias)
- Atualizar página existente AdminSMSGateways
- Criar componentes base (Dashboard, Selector)
- Implementar layout responsivo

### Fase 2: Configuração BulkGate (2-3 dias)
- Criar formulário de configuração BulkGate
- Implementar testes de conexão
- Integrar com sistema de armazenamento

### Fase 3: Sistema de Fallback (1-2 dias)
- Implementar lógica de fallback
- Criar logs de fallback
- Testes de integração

### Fase 4: Estatísticas e Polimento (1-2 dias)
- Implementar gráficos e métricas
- Melhorias de UX
- Testes finais

**Total Estimado**: 5-9 dias úteis

---

*Esta especificação serve como guia completo para implementação da página unificada de configurações de gateways SMS.*