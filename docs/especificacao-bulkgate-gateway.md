# Especificação: Implementação Completa do BulkGate Gateway

## 1. Visão Geral

Esta especificação define a implementação do BulkGate como gateway alternativo de SMS, mantendo total compatibilidade com o BulkSMS existente e adicionando funcionalidades de fallback automático.

## 2. Arquitetura de Gateways

### 2.1 Estrutura Atual (Manter)
```typescript
// src/lib/sms-gateways/gateways/BulkSMSGateway.ts (EXISTENTE - NÃO ALTERAR)
export class BulkSMSGateway implements SMSGateway {
  // Implementação atual mantida
}
```

### 2.2 Nova Implementação BulkGate
```typescript
// src/lib/sms-gateways/gateways/BulkGateGateway.ts (NOVO)
export class BulkGateGateway implements SMSGateway {
  private applicationId = '35101';
  private applicationToken: string;
  
  constructor(applicationToken: string) {
    this.applicationToken = applicationToken;
  }
  
  async sendSingle(message: SMSMessage): Promise<SMSResult>
  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult>
  async getBalance(): Promise<GatewayBalance>
  async getStatus(messageId: string): Promise<SMSStatus>
  async validateSenderID(senderId: string): Promise<boolean>
  async testConnection(): Promise<boolean>
}
```

### 2.3 Endpoints BulkGate
```
BASE_URL: https://api.bulkgate.com

Autenticação:
Headers: {
  'Authorization': 'Bearer {applicationToken}',
  'Content-Type': 'application/json'
}

Endpoints:
POST /v2.0/sms/send           - Envio de SMS
GET  /v2.0/credit/balance     - Consulta saldo
GET  /v2.0/sms/status/{id}    - Status de mensagem
POST /v2.0/sender-id/verify   - Validação de Sender ID
```

## 3. Configurações Unificadas

### 3.1 Nova Página: AdminSMSGateways
```typescript
// src/pages/AdminSMSGateways.tsx (NOVO)
interface GatewayCard {
  id: string;
  name: 'bulksms' | 'bulkgate';
  displayName: string;
  status: 'connected' | 'disconnected' | 'error';
  isPrimary: boolean;
  isActive: boolean;
  stats: {
    smsSent: number;
    successRate: number;
    creditsUsed: number;
  };
}

// UI Components:
// - GatewayStatusCard
// - GatewayConfigModal  
// - GatewayTestModal
// - FallbackSettings
```

### 3.2 Card Layout (UI)
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* BulkSMS Card */}
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">BulkSMS</h3>
      <Badge variant={bulksmsStatus === 'connected' ? 'success' : 'destructive'}>
        {bulksmsStatus}
      </Badge>
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between">
        <span>SMS Enviados:</span>
        <span className="font-medium">{stats.smsSent}</span>
      </div>
      <div className="flex justify-between">
        <span>Taxa de Sucesso:</span>
        <span className="font-medium">{stats.successRate}%</span>
      </div>
      <div className="flex justify-between">
        <span>Créditos Consumidos:</span>
        <span className="font-medium">{stats.creditsUsed}</span>
      </div>
    </div>
    
    <div className="flex gap-2 mt-4">
      <Button variant="outline" onClick={() => testGateway('bulksms')}>
        Testar
      </Button>
      <Button onClick={() => openConfig('bulksms')}>
        Configurar
      </Button>
      {isPrimary && <Badge variant="default">Primário</Badge>}
    </div>
  </Card>
  
  {/* BulkGate Card - Layout similar */}
</div>
```

### 3.3 Configuração de Fallback
```jsx
<Card className="p-6 mt-6">
  <h3 className="text-lg font-semibold mb-4">Configurações de Fallback</h3>
  
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Label>Gateway Primário</Label>
      <Select value={primaryGateway} onValueChange={setPrimaryGateway}>
        <SelectItem value="bulksms">BulkSMS</SelectItem>
        <SelectItem value="bulkgate">BulkGate</SelectItem>
      </Select>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="auto-fallback" 
        checked={autoFallback} 
        onCheckedChange={setAutoFallback} 
      />
      <Label htmlFor="auto-fallback">
        Ativar fallback automático em caso de falha
      </Label>
    </div>
    
    <div className="text-sm text-muted-foreground">
      Se o gateway primário falhar, o sistema tentará enviar automaticamente 
      pelo gateway secundário.
    </div>
  </div>
</Card>
```

## 4. Sender IDs Multi-Gateway

### 4.1 Atualização da Tabela
```sql
-- Já implementado na migração existente
ALTER TABLE public.sender_ids 
ADD COLUMN bulksms_status TEXT DEFAULT 'pending',
ADD COLUMN bulkgate_status TEXT DEFAULT 'pending', 
ADD COLUMN supported_gateways TEXT[] DEFAULT ARRAY['bulksms'];
```

### 4.2 Interface Atualizada
```jsx
// src/pages/AdminSenderIDs.tsx (ATUALIZAR)
<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Sender ID</TableHeader>
      <TableHeader>Status BulkSMS</TableHeader>
      <TableHeader>Status BulkGate</TableHeader>
      <TableHeader>Gateways Suportados</TableHeader>
      <TableHeader>Ações</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    {senderIds.map((sender) => (
      <TableRow key={sender.id}>
        <TableCell>{sender.sender_id}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(sender.bulksms_status)}>
            {sender.bulksms_status}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(sender.bulkgate_status)}>
            {sender.bulkgate_status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            {sender.supported_gateways?.map(gateway => (
              <Badge key={gateway} variant="outline">
                {gateway}
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Ações</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => validateInBulkSMS(sender.id)}>
                Validar no BulkSMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => validateInBulkGate(sender.id)}>
                Validar no BulkGate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## 5. Sistema de Fallback e Logs

### 5.1 Lógica de Fallback
```typescript
// src/lib/sms-gateways/manager/SMSGatewayManager.ts (ATUALIZAR)
export class SMSGatewayManager {
  async sendWithFallback(message: SMSMessage): Promise<SMSResult> {
    const primaryGateway = await this.getPrimaryGateway();
    const fallbackEnabled = await this.isFallbackEnabled();
    
    try {
      // Tentativa no gateway primário
      const result = await primaryGateway.sendSingle(message);
      
      if (result.success) {
        await this.logSuccess(message, primaryGateway.name, result);
        return result;
      }
      
      // Se falhou e fallback está habilitado
      if (fallbackEnabled) {
        const secondaryGateway = await this.getSecondaryGateway();
        
        if (secondaryGateway) {
          console.log(`Tentando fallback para ${secondaryGateway.name}`);
          
          const fallbackResult = await secondaryGateway.sendSingle(message);
          
          await this.logFallback(
            message, 
            primaryGateway.name, 
            secondaryGateway.name, 
            result.error,
            fallbackResult
          );
          
          return fallbackResult;
        }
      }
      
      await this.logFailure(message, primaryGateway.name, result.error);
      return result;
      
    } catch (error) {
      if (fallbackEnabled) {
        // Implementar fallback para exceptions
      }
      
      throw error;
    }
  }
  
  private async logFallback(
    message: SMSMessage,
    originalGateway: string,
    fallbackGateway: string,
    originalError: string,
    result: SMSResult
  ) {
    await supabase.from('sms_logs').insert({
      campaign_id: message.campaignId,
      user_id: message.userId,
      phone_number: message.to,
      message: message.text,
      gateway_used: fallbackGateway,
      original_gateway: originalGateway,
      fallback_attempted: true,
      status: result.success ? 'sent' : 'failed',
      error_message: result.success ? null : result.error,
      gateway_message_id: result.messageId
    });
  }
}
```

### 5.2 Atualização da Tabela SMS Logs
```sql
-- Já implementado na migração existente
ALTER TABLE public.sms_logs 
ADD COLUMN gateway_used TEXT DEFAULT 'bulksms',
ADD COLUMN gateway_message_id TEXT,
ADD COLUMN fallback_attempted BOOLEAN DEFAULT false,
ADD COLUMN original_gateway TEXT;
```

### 5.3 Interface de Logs
```jsx
// src/pages/AdminReports.tsx (ATUALIZAR)
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4">Estatísticas por Gateway</h3>
  
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div className="text-center p-4 bg-blue-50 rounded-lg">
      <div className="text-2xl font-bold text-blue-600">
        {stats.bulksms.total}
      </div>
      <div className="text-sm text-blue-600">BulkSMS</div>
    </div>
    
    <div className="text-center p-4 bg-green-50 rounded-lg">
      <div className="text-2xl font-bold text-green-600">
        {stats.bulkgate.total}
      </div>
      <div className="text-sm text-green-600">BulkGate</div>
    </div>
  </div>
  
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span>Total de Fallbacks:</span>
      <span className="font-medium">{stats.fallbacks}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Taxa de Sucesso Geral:</span>
      <span className="font-medium">{stats.overallSuccessRate}%</span>
    </div>
  </div>
</Card>
```

## 6. Webhooks e Edge Functions

### 6.1 Edge Function BulkGate Webhook
```typescript
// supabase/functions/bulkgate-webhook/index.ts (JÁ IMPLEMENTADO)
// Processar callbacks de status de entrega do BulkGate
```

### 6.2 Edge Function Gateway Status
```typescript
// supabase/functions/gateway-status/index.ts (ATUALIZAR)
export async function checkBulkGateStatus(apiKey: string): Promise<GatewayStatus> {
  try {
    const response = await fetch('https://api.bulkgate.com/v2.0/credit/balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        configured: true,
        connected: false,
        balance: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    return {
      configured: true,
      connected: true,
      balance: {
        amount: data.credit,
        currency: 'EUR' // BulkGate usa EUR
      },
      error: null
    };
    
  } catch (error) {
    return {
      configured: true,
      connected: false,
      balance: null,
      error: error.message
    };
  }
}
```

## 7. Exemplos de Payloads

### 7.1 BulkGate Send SMS
```json
// Request
POST https://api.bulkgate.com/v2.0/sms/send
{
  "application_id": "35101",
  "application_token": "TOKEN_AQUI",
  "number": "+244900000000",
  "text": "Sua mensagem aqui",
  "sender_id": "SMSao",
  "sender_id_value": "SMSao"
}

// Response (Sucesso)
{
  "data": {
    "total": {
      "price": 0.05,
      "sms": 1,
      "recipients": 1
    },
    "response": [
      {
        "status": "accepted",
        "sms_id": "bulkgate_message_123",
        "price": 0.05,
        "credit": 99.95,
        "number": "+244900000000"
      }
    ]
  }
}

// Response (Erro)
{
  "error": {
    "type": "invalid_credentials",
    "description": "Invalid application token"
  }
}
```

### 7.2 BulkGate Balance
```json
// Request
GET https://api.bulkgate.com/v2.0/credit/balance

// Response
{
  "data": {
    "credit": 100.50,
    "currency": "EUR"
  }
}
```

### 7.3 BulkGate Webhook
```json
// Webhook payload recebido
{
  "id": "bulkgate_message_123",
  "status": "delivered",
  "delivered_at": "2024-01-01T12:00:00Z",
  "price": 0.05,
  "error": null
}
```

## 8. Estrutura de Navegação Atualizada

### 8.1 AdminSettings.tsx (ATUALIZAR)
```jsx
<Tabs defaultValue="smtp" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="smtp">
      <Mail className="h-4 w-4" />
      <span>SMTP</span>
    </TabsTrigger>
    <TabsTrigger value="sms-gateways">
      <MessageSquare className="h-4 w-4" />
      <span>Gateways SMS</span>
    </TabsTrigger>
    <TabsTrigger value="sms">
      <Settings className="h-4 w-4" />
      <span>Config. SMS</span>
    </TabsTrigger>
    <TabsTrigger value="sender-ids">
      <Send className="h-4 w-4" />
      <span>Sender IDs</span>
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="sms-gateways" className="mt-6">
    <AdminSMSGateways />
  </TabsContent>
  
  {/* Outras tabs existentes */}
</Tabs>
```

## 9. Testes Automatizados

### 9.1 Testes de Gateway
```typescript
// tests/gateways.test.ts
describe('SMS Gateways', () => {
  test('BulkSMS connection', async () => {
    const gateway = new BulkSMSGateway(tokenId, tokenSecret);
    const isConnected = await gateway.testConnection();
    expect(isConnected).toBe(true);
  });
  
  test('BulkGate connection', async () => {
    const gateway = new BulkGateGateway(applicationToken);
    const isConnected = await gateway.testConnection();
    expect(isConnected).toBe(true);
  });
  
  test('Fallback mechanism', async () => {
    const manager = new SMSGatewayManager();
    
    // Simular falha no primário
    jest.spyOn(manager, 'getPrimaryGateway')
      .mockResolvedValue(createFailingGateway());
    
    const result = await manager.sendWithFallback(testMessage);
    
    expect(result.success).toBe(true);
    expect(result.gatewayUsed).toBe('fallback');
  });
});
```

### 9.2 Testes de UI
```typescript
// tests/ui/admin-gateways.test.tsx
describe('AdminSMSGateways', () => {
  test('displays gateway status correctly', () => {
    render(<AdminSMSGateways />);
    
    expect(screen.getByText('BulkSMS')).toBeInTheDocument();
    expect(screen.getByText('BulkGate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Testar' })).toBeInTheDocument();
  });
  
  test('gateway test functionality', async () => {
    render(<AdminSMSGateways />);
    
    const testButton = screen.getByRole('button', { name: 'Testar' });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText(/teste realizado/i)).toBeInTheDocument();
    });
  });
});
```

## 10. Checklist de Implementação

### Fase 1: Infraestrutura
- [ ] Implementar `BulkGateGateway` class
- [ ] Atualizar `SMSGatewayManager` com fallback
- [ ] Criar edge function `gateway-status` atualizada
- [ ] Testar conexões BulkGate

### Fase 2: Interface Admin
- [ ] Criar página `AdminSMSGateways`
- [ ] Atualizar `AdminSettings` com nova tab
- [ ] Implementar cards de status
- [ ] Criar modais de configuração

### Fase 3: Sender IDs
- [ ] Atualizar interface `AdminSenderIDs`
- [ ] Implementar validação multi-gateway
- [ ] Testar aprovação em ambos os serviços

### Fase 4: Logs e Relatórios
- [ ] Atualizar `AdminReports` com estatísticas por gateway
- [ ] Implementar visualização de fallbacks
- [ ] Criar alertas para falhas

### Fase 5: Testes
- [ ] Implementar testes unitários
- [ ] Testes de integração com APIs
- [ ] Testes de UI automatizados
- [ ] Teste de fallback em produção

## 11. Instruções de Deploy

1. **Configurar Credenciais**
   ```bash
   # Supabase Secrets
   BULKGATE_API_KEY=seu_application_token_aqui
   ```

2. **Webhooks**
   ```
   BulkGate Webhook URL: 
   https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/bulkgate-webhook
   ```

3. **Validação Pós-Deploy**
   - Acessar `/admin/settings` → aba "Gateways SMS"
   - Testar conexão de ambos os gateways
   - Enviar SMS de teste
   - Verificar logs de fallback

Esta especificação garante uma implementação robusta e completa do BulkGate, mantendo total compatibilidade com o sistema existente.