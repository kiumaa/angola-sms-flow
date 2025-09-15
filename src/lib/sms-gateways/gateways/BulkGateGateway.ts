import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';

export class BulkGateGateway implements SMSGateway {
  name = 'bulkgate';
  displayName = 'BulkGate';
  
  private apiKey: string;
  private baseUrl = 'https://portal.bulkgate.com/api/1.0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      // Try v2 API first (Bearer token)
      let response = await fetch('https://portal.bulkgate.com/api/2.0/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: message.to,
          text: message.text,
          sender_id: {
            type: 'text',
            value: message.from || 'SMSAO'
          },
          country: 'ao', // Específico para Angola
          unicode: this.containsUnicode(message.text)
        })
      });

      let data = await response.json();

      // Se v2 falhar, tenta v1 API como fallback
      if (!response.ok && (response.status === 401 || response.status === 404)) {
        const parts = this.apiKey.split(':');
        if (parts.length === 2) {
          response = await fetch(`${this.baseUrl}/simple/transactional`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              application_id: parts[0],
              application_token: parts[1],
              number: message.to,
              text: message.text,
              sender_id: message.from || 'SMSAO',
              sender_id_value: message.from || 'SMSAO',
              country: 'ao'
            })
          });
          data = await response.json();
        }
      }
      
      if (response.ok && data.data && data.data.status === 'accepted') {
        return {
          success: true,
          messageId: data.data.sms_id,
          gateway: this.name,
          cost: 1 // Default cost, should be calculated based on country
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to send SMS via BulkGate',
          gateway: this.name
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gateway: this.name
      };
    }
  }

  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult> {
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
      results,
      gateway: this.name
    };
  }

  async getBalance(): Promise<GatewayBalance> {
    try {
      // Try v2 API first
      let response = await fetch('https://portal.bulkgate.com/api/2.0/credit/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          credits: data.balance || 0,
          currency: data.currency || 'EUR',
          lastUpdated: new Date().toISOString()
        };
      }

      // Fallback to v1 API
      const parts = this.apiKey.split(':');
      if (parts.length === 2) {
        response = await fetch(`${this.baseUrl}/info/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            application_id: parts[0],
            application_token: parts[1]
          })
        });

        const data = await response.json();
        
        if (response.ok && data.data) {
          return {
            credits: data.data.credit || 0,
            currency: data.data.currency || 'EUR',
            lastUpdated: new Date().toISOString()
          };
        } else {
          throw new Error(data.error?.message || 'Failed to get balance');
        }
      } else {
        throw new Error('Invalid API key format');
      }
    } catch (error) {
      throw new Error(`Failed to get BulkGate balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/info/delivery-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: this.apiKey,
          application_token: this.apiKey,
          sms_id: messageId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.data) {
        return {
          messageId,
          status: this.mapBulkGateStatus(data.data.status),
          deliveredAt: data.data.delivered_at,
          error: data.data.error
        };
      } else {
        throw new Error(data.error?.message || 'Failed to get status');
      }
    } catch (error) {
      return {
        messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateSenderID(senderId: string): Promise<boolean> {
    try {
      // Validação específica para Angola e BulkGate
      // Permite sender IDs alfanuméricos até 11 caracteres
      // Para Angola, aceita também números específicos
      if (/^[a-zA-Z0-9]{1,11}$/.test(senderId)) {
        return true;
      }
      
      // Números específicos válidos para Angola
      if (/^(\+244|244)?[9][0-9]{8}$/.test(senderId)) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private containsUnicode(text: string): boolean {
    // Verifica se o texto contém caracteres especiais que requerem Unicode
    return /[^\x00-\x7F]/.test(text);
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapBulkGateStatus(status: string): 'pending' | 'sent' | 'delivered' | 'failed' {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'buffered':
        return 'pending';
      case 'sent':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'undelivered':
      case 'expired':
      case 'rejected':
        return 'failed';
      default:
        return 'pending';
    }
  }
}