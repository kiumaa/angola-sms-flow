# Especificação Técnica: Fase 1 - Infraestrutura BulkGate Gateway

## 1. Visão Geral

Esta especificação define a implementação da infraestrutura base para integração do BulkGate Gateway na plataforma SMS Marketing Angola, mantendo compatibilidade com a arquitetura existente.

## 2. Estrutura de Arquivos

### 2.1 Arquivos a Serem Criados/Modificados

```
src/lib/sms-gateways/
├── gateways/
│   ├── BulkSMSGateway.ts           (existente - manter)
│   └── BulkGateGateway.ts          (atualizar implementação)
├── manager/
│   └── SMSGatewayManager.ts        (atualizar - adicionar BulkGate)
├── interfaces/
│   ├── SMSGateway.ts               (existente - verificar conformidade)
│   └── SMSTypes.ts                 (existente - verificar conformidade)
└── index.ts                        (atualizar exports)

supabase/functions/
├── test-bulkgate/
│   └── index.ts                    (novo endpoint de teste)
└── gateway-status/
    └── index.ts                    (atualizar para BulkGate)

tests/
└── gateways/
    └── BulkGateGateway.test.ts     (novo)
```

## 3. Implementação do BulkGateGateway

### 3.1 Interface Base (Verificar Conformidade)

```typescript
// src/lib/sms-gateways/interfaces/SMSGateway.ts
export interface SMSGateway {
  sendSingle(message: SMSMessage): Promise<SMSResult>;
  sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult>;
  getBalance(): Promise<GatewayBalance>;
  getStatus(messageId: string): Promise<SMSStatus>;
  validateSenderID(senderId: string): Promise<boolean>;
  testConnection(): Promise<boolean>;
  isConfigured(): Promise<boolean>;
}

export interface SMSMessage {
  to: string;
  text: string;
  from?: string;
  campaignId?: string;
  userId?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}
```

### 3.2 Implementação BulkGateGateway

```typescript
// src/lib/sms-gateways/gateways/BulkGateGateway.ts
export class BulkGateGateway implements SMSGateway {
  private readonly baseUrl = 'https://api.bulkgate.com';
  private readonly applicationId = '35101';
  private applicationToken: string;

  constructor(applicationToken: string) {
    this.applicationToken = applicationToken;
  }

  /**
   * Envia SMS único via BulkGate API
   */
  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const payload = {
        application_id: this.applicationId,
        application_token: this.applicationToken,
        number: message.to,
        text: message.text,
        sender_id: message.from || 'SMSao',
        sender_id_value: message.from || 'SMSao'
      };

      const response = await fetch(`${this.baseUrl}/v2.0/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.applicationToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.description || `HTTP ${response.status}`
        };
      }

      if (data.data?.response?.[0]?.status === 'accepted') {
        return {
          success: true,
          messageId: data.data.response[0].sms_id,
          cost: data.data.response[0].price
        };
      }

      return {
        success: false,
        error: 'Message not accepted by BulkGate'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Consulta saldo da conta BulkGate
   */
  async getBalance(): Promise<GatewayBalance> {
    try {
      const response = await fetch(`${this.baseUrl}/v2.0/credit/balance`, {
        headers: {
          'Authorization': `Bearer ${this.applicationToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        amount: data.data?.credit || 0,
        currency: 'EUR' // BulkGate usa EUR
      };

    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Consulta status de mensagem específica
   */
  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/v2.0/sms/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.applicationToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return { status: 'unknown', error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      // Mapear status BulkGate para formato padrão
      const status = this.mapBulkGateStatus(data.data?.status);
      
      return {
        status,
        deliveredAt: data.data?.delivered_at ? new Date(data.data.delivered_at) : undefined
      };

    } catch (error) {
      return { 
        status: 'unknown', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Testa conexão com BulkGate
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifica se o gateway está configurado
   */
  async isConfigured(): Promise<boolean> {
    return !!this.applicationToken && this.applicationToken.length > 0;
  }

  /**
   * Valida Sender ID no BulkGate
   */
  async validateSenderID(senderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v2.0/sender-id/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.applicationToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          application_id: this.applicationId,
          sender_id: senderId
        })
      });

      const data = await response.json();
      return response.ok && data.data?.verified === true;

    } catch {
      return false;
    }
  }

  /**
   * Envio em lote (implementação futura)
   */
  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult> {
    // Implementação simplificada - enviar um por vez
    const results: SMSResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const message of messages) {
      const result = await this.sendSingle(message);
      results.push(result);
      
      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }
    }

    return {
      success: totalSent > 0,
      totalSent,
      totalFailed,
      results
    };
  }

  /**
   * Mapeia status do BulkGate para formato padrão
   */
  private mapBulkGateStatus(bulkGateStatus: string): string {
    switch (bulkGateStatus?.toLowerCase()) {
      case 'delivered':
        return 'delivered';
      case 'sent':
      case 'accepted':
        return 'sent';
      case 'failed':
      case 'rejected':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
```

## 4. Configuração de Ambiente

### 4.1 Supabase Secrets (Recomendado)

```bash
# Via Supabase CLI ou Dashboard
BULKGATE_API_KEY=uWJ0hdvbRnAm6pzkbjHsSjXNT0sJUOxkdzHrEnxQRXfgHW0HLz
```

### 4.2 Atualização do SMSGatewayManager

```typescript
// src/lib/sms-gateways/manager/SMSGatewayManager.ts
import { BulkGateGateway } from '../gateways/BulkGateGateway';
import { BulkSMSGateway } from '../gateways/BulkSMSGateway';

export class SMSGatewayManager {
  private gateways = new Map<string, SMSGateway>();
  private primaryGateway: string = 'bulksms';

  async initialize(config: {
    bulksmsTokenId?: string;
    bulksmsTokenSecret?: string;
    bulkgateApiKey?: string;
  }): Promise<void> {
    // Inicializar BulkSMS (existente)
    if (config.bulksmsTokenId && config.bulksmsTokenSecret) {
      const bulkSMS = new BulkSMSGateway(
        config.bulksmsTokenId, 
        config.bulksmsTokenSecret
      );
      this.gateways.set('bulksms', bulkSMS);
    }

    // Inicializar BulkGate (novo)
    if (config.bulkgateApiKey) {
      const bulkGate = new BulkGateGateway(config.bulkgateApiKey);
      this.gateways.set('bulkgate', bulkGate);
    }
  }

  async sendSMS(message: SMSMessage, gatewayName?: string): Promise<SMSResult> {
    const gateway = gatewayName 
      ? this.gateways.get(gatewayName)
      : this.gateways.get(this.primaryGateway);

    if (!gateway) {
      throw new Error(`Gateway not found: ${gatewayName || this.primaryGateway}`);
    }

    return await gateway.sendSingle(message);
  }

  async testGateway(gatewayName: string): Promise<boolean> {
    const gateway = this.gateways.get(gatewayName);
    return gateway ? await gateway.testConnection() : false;
  }

  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }
}
```

### 4.3 Atualização do Index

```typescript
// src/lib/sms-gateways/index.ts
export { SMSGatewayManager } from './manager/SMSGatewayManager';
export { BulkSMSGateway } from './gateways/BulkSMSGateway';
export { BulkGateGateway } from './gateways/BulkGateGateway';

export type { SMSGateway } from './interfaces/SMSGateway';
export type { 
  SMSMessage, 
  SMSResult, 
  SMSBulkResult, 
  SMSStatus, 
  GatewayBalance, 
  GatewayConfig,
  FallbackResult 
} from './interfaces/SMSTypes';

// Utility function para criar manager com variáveis de ambiente
export async function createSMSGatewayManager(env: Record<string, string | undefined>) {
  const manager = new SMSGatewayManager();
  
  await manager.initialize({
    bulksmsTokenId: env.BULKSMS_TOKEN_ID,
    bulksmsTokenSecret: env.BULKSMS_TOKEN_SECRET,
    bulkgateApiKey: env.BULKGATE_API_KEY
  });
  
  return manager;
}
```

## 5. Endpoint de Teste

### 5.1 Edge Function para Teste

```typescript
// supabase/functions/test-bulkgate/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestRequest {
  to: string;
  message: string;
  from?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, message, from }: TestRequest = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, message' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Usar BulkGate Gateway
    const bulkgateApiKey = Deno.env.get('BULKGATE_API_KEY');
    
    if (!bulkgateApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'BulkGate API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Payload para BulkGate
    const payload = {
      application_id: '35101',
      application_token: bulkgateApiKey,
      number: to,
      text: message,
      sender_id: from || 'SMSao',
      sender_id_value: from || 'SMSao'
    };

    const response = await fetch('https://api.bulkgate.com/v2.0/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bulkgateApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('BulkGate API Error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.description || `HTTP ${response.status}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const messageId = data.data?.response?.[0]?.sms_id;
    const success = data.data?.response?.[0]?.status === 'accepted';

    // Log no sms_logs
    if (success && messageId) {
      await supabase.from('sms_logs').insert({
        phone_number: to,
        message: message,
        gateway_used: 'bulkgate',
        gateway_message_id: messageId,
        status: 'sent',
        cost_credits: Math.ceil(message.length / 160), // Estimativa
        user_id: null, // Teste sem usuário específico
        campaign_id: null // Teste sem campanha
      });
    }

    return new Response(
      JSON.stringify({ 
        success,
        messageId: success ? messageId : undefined,
        error: success ? undefined : 'Message not accepted by BulkGate'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Test BulkGate Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### 5.2 Atualização config.toml

```toml
# supabase/config.toml
project_id = "hwxxcprqxqznselwzghi"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://localhost:54321"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
port = 54325
file_size_limit = "50MiB"

[auth]
enabled = true
port = 54326
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_signup = true
enable_email_confirmations = false
enable_email_change_confirmations = true
enable_phone_confirmations = false
enable_phone_change_confirmations = true

[functions.test-bulkgate]
verify_jwt = false

[functions.bulkgate-webhook]
verify_jwt = false

[functions.gateway-status]
verify_jwt = true

[functions.send-sms]
verify_jwt = true
```

## 6. Persistência em sms_logs

### 6.1 Verificação da Estrutura (Já Implementada)

A tabela `sms_logs` já possui as colunas necessárias:

```sql
-- Colunas já existentes para suporte multi-gateway
gateway_used TEXT DEFAULT 'bulksms'
gateway_message_id TEXT
fallback_attempted BOOLEAN DEFAULT false
original_gateway TEXT
```

### 6.2 Função Helper para Logging

```typescript
// src/lib/utils/smsLogger.ts
import { supabase } from '@/integrations/supabase/client';

interface SMSLogEntry {
  campaignId?: string;
  userId?: string;
  phoneNumber: string;
  message: string;
  gatewayUsed: 'bulksms' | 'bulkgate';
  gatewayMessageId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  costCredits?: number;
  errorMessage?: string;
  fallbackAttempted?: boolean;
  originalGateway?: string;
}

export async function logSMSEvent(entry: SMSLogEntry): Promise<void> {
  try {
    const { error } = await supabase.from('sms_logs').insert({
      campaign_id: entry.campaignId,
      user_id: entry.userId,
      phone_number: entry.phoneNumber,
      message: entry.message,
      gateway_used: entry.gatewayUsed,
      gateway_message_id: entry.gatewayMessageId,
      status: entry.status,
      cost_credits: entry.costCredits || 1,
      error_message: entry.errorMessage,
      fallback_attempted: entry.fallbackAttempted || false,
      original_gateway: entry.originalGateway
    });

    if (error) {
      console.error('Failed to log SMS event:', error);
    }
  } catch (error) {
    console.error('SMS logging error:', error);
  }
}

export async function updateSMSStatus(
  gatewayMessageId: string, 
  gatewayUsed: string,
  status: string,
  deliveredAt?: Date,
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (deliveredAt) {
      updateData.delivered_at = deliveredAt.toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('sms_logs')
      .update(updateData)
      .eq('gateway_message_id', gatewayMessageId)
      .eq('gateway_used', gatewayUsed);

    if (error) {
      console.error('Failed to update SMS status:', error);
    }
  } catch (error) {
    console.error('SMS status update error:', error);
  }
}
```

## 7. Testes Unitários

### 7.1 Configuração de Testes

```typescript
// tests/gateways/BulkGateGateway.test.ts
import { BulkGateGateway } from '../../src/lib/sms-gateways/gateways/BulkGateGateway';
import { SMSMessage } from '../../src/lib/sms-gateways/interfaces/SMSTypes';

// Mock fetch globally
global.fetch = jest.fn();

describe('BulkGateGateway', () => {
  let gateway: BulkGateGateway;
  const mockApiKey = 'test-api-key-12345';

  beforeEach(() => {
    gateway = new BulkGateGateway(mockApiKey);
    jest.clearAllMocks();
  });

  describe('sendSingle', () => {
    const testMessage: SMSMessage = {
      to: '+244900000000',
      text: 'Test message',
      from: 'SMSao'
    };

    it('should send SMS successfully', async () => {
      const mockResponse = {
        data: {
          total: { price: 0.05, sms: 1, recipients: 1 },
          response: [{
            status: 'accepted',
            sms_id: 'bulkgate_123',
            price: 0.05,
            credit: 99.95,
            number: '+244900000000'
          }]
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await gateway.sendSingle(testMessage);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('bulkgate_123');
      expect(result.cost).toBe(0.05);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.bulkgate.com/v2.0/sms/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockApiKey}`
          })
        })
      );
    });

    it('should handle API errors', async () => {
      const mockErrorResponse = {
        error: {
          type: 'invalid_credentials',
          description: 'Invalid application token'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse
      });

      const result = await gateway.sendSingle(testMessage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid application token');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await gateway.sendSingle(testMessage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getBalance', () => {
    it('should return balance successfully', async () => {
      const mockResponse = {
        data: {
          credit: 150.75,
          currency: 'EUR'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const balance = await gateway.getBalance();

      expect(balance.amount).toBe(150.75);
      expect(balance.currency).toBe('EUR');
    });

    it('should throw error on API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(gateway.getBalance()).rejects.toThrow(
        'Failed to get balance: HTTP 500: Internal Server Error'
      );
    });
  });

  describe('getStatus', () => {
    it('should return delivered status', async () => {
      const mockResponse = {
        data: {
          status: 'delivered',
          delivered_at: '2024-01-01T12:00:00Z'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const status = await gateway.getStatus('test-message-id');

      expect(status.status).toBe('delivered');
      expect(status.deliveredAt).toEqual(new Date('2024-01-01T12:00:00Z'));
    });

    it('should return pending status for unknown responses', async () => {
      const mockResponse = {
        data: {
          status: 'processing'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const status = await gateway.getStatus('test-message-id');

      expect(status.status).toBe('pending');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection succeeds', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { credit: 100 } })
      });

      const result = await gateway.testConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await gateway.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key is set', async () => {
      const result = await gateway.isConfigured();
      expect(result).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const emptyGateway = new BulkGateGateway('');
      const result = await emptyGateway.isConfigured();
      expect(result).toBe(false);
    });
  });
});
```

### 7.2 Testes de Integração

```typescript
// tests/integration/smsGateway.integration.test.ts
import { SMSGatewayManager } from '../../src/lib/sms-gateways/manager/SMSGatewayManager';

describe('SMS Gateway Integration', () => {
  let manager: SMSGatewayManager;

  beforeEach(async () => {
    manager = new SMSGatewayManager();
    await manager.initialize({
      bulkgateApiKey: 'test-key'
    });
  });

  it('should send SMS via BulkGate', async () => {
    // Mock implementation
    const testMessage = {
      to: '+244900000000',
      text: 'Integration test message'
    };

    const result = await manager.sendSMS(testMessage, 'bulkgate');
    
    // Assertions based on mocked responses
    expect(result).toBeDefined();
  });

  it('should test gateway connection', async () => {
    const isConnected = await manager.testGateway('bulkgate');
    expect(typeof isConnected).toBe('boolean');
  });
});
```

## 8. Scripts NPM/Comandos

### 8.1 Scripts de Teste

```json
// package.json (adicionar aos scripts existentes)
{
  "scripts": {
    "test:gateways": "jest tests/gateways --verbose",
    "test:integration": "jest tests/integration --verbose",
    "test:bulkgate": "jest tests/gateways/BulkGateGateway.test.ts"
  }
}
```

### 8.2 Comandos de Deploy

```bash
# Deploy das edge functions
supabase functions deploy test-bulkgate

# Definir secrets
supabase secrets set BULKGATE_API_KEY=uWJ0hdvbRnAm6pzkbjHsSjXNT0sJUOxkdzHrEnxQRXfgHW0HLz
```

## 9. Checklist de Implementação

### Fase 1 - Infraestrutura Base

- [ ] **Implementar BulkGateGateway class**
  - [ ] Método `sendSingle`
  - [ ] Método `getBalance`
  - [ ] Método `getStatus`
  - [ ] Método `testConnection`
  - [ ] Método `validateSenderID`

- [ ] **Atualizar SMSGatewayManager**
  - [ ] Adicionar inicialização BulkGate
  - [ ] Método de seleção de gateway
  - [ ] Métodos de teste

- [ ] **Criar edge function de teste**
  - [ ] Endpoint `test-bulkgate`
  - [ ] Validação de parâmetros
  - [ ] Log em `sms_logs`

- [ ] **Configurar secrets**
  - [ ] `BULKGATE_API_KEY` no Supabase
  - [ ] Atualizar `config.toml`

- [ ] **Implementar testes**
  - [ ] Testes unitários BulkGateGateway
  - [ ] Testes de integração
  - [ ] Mocks de HTTP

- [ ] **Validação pós-implementação**
  - [ ] Teste de conexão BulkGate
  - [ ] Envio de SMS de teste
  - [ ] Verificação de logs
  - [ ] Consulta de saldo

## 10. Endpoints de Teste

### 10.1 Teste via cURL

```bash
# Testar envio BulkGate
curl -X POST https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/test-bulkgate \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+244900000000",
    "message": "Teste BulkGate Gateway",
    "from": "SMSao"
  }'

# Resposta esperada:
{
  "success": true,
  "messageId": "bulkgate_123456",
  "error": null
}
```

### 10.2 Teste via Interface Admin (Futuro)

```javascript
// Exemplo de chamada frontend
const testBulkGate = async () => {
  const response = await supabase.functions.invoke('test-bulkgate', {
    body: {
      to: '+244900000000',
      message: 'Teste da interface admin'
    }
  });
  
  console.log('Resultado:', response.data);
};
```

Esta especificação fornece a base completa para implementar a infraestrutura BulkGate, mantendo compatibilidade com o sistema existente e preparando para as próximas fases de desenvolvimento.