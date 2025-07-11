import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';

export class BulkGateGateway implements SMSGateway {
  name = 'bulkgate';
  displayName = 'BulkGate';
  
  private apiKey: string;
  private baseUrl = 'https://api.bulkgate.com/v2.0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getAuthHeader(): string {
    return `Bearer ${this.apiKey}`;
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          messages: [{
            to: message.to,
            from: message.from,
            text: message.text
          }]
        })
      });

      const result = await response.json();

      if (response.ok && result.data && result.data.length > 0) {
        const messageResult = result.data[0];
        
        if (messageResult.status === 'accepted') {
          return {
            success: true,
            messageId: messageResult.id,
            gateway: this.name,
            cost: messageResult.price || 1
          };
        } else {
          return {
            success: false,
            error: messageResult.error || 'Message not accepted',
            gateway: this.name
          };
        }
      } else {
        return {
          success: false,
          error: result.error?.message || `HTTP ${response.status}`,
          gateway: this.name
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        gateway: this.name
      };
    }
  }

  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult> {
    try {
      const bulkMessages = messages.map(msg => ({
        to: msg.to,
        from: msg.from,
        text: msg.text
      }));

      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          messages: bulkMessages
        })
      });

      const result = await response.json();
      const results: SMSResult[] = [];
      let totalSent = 0;
      let totalFailed = 0;

      if (response.ok && result.data) {
        for (const messageResult of result.data) {
          const smsResult: SMSResult = {
            success: messageResult.status === 'accepted',
            messageId: messageResult.id,
            error: messageResult.status !== 'accepted' ? messageResult.error : undefined,
            gateway: this.name,
            cost: messageResult.price || 1
          };

          results.push(smsResult);
          
          if (smsResult.success) {
            totalSent++;
          } else {
            totalFailed++;
          }
        }
      } else {
        // Se a requisição falhou, marcar todas as mensagens como falharam
        for (const message of messages) {
          results.push({
            success: false,
            error: result.error?.message || `HTTP ${response.status}`,
            gateway: this.name
          });
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
    } catch (error) {
      const results: SMSResult[] = messages.map(() => ({
        success: false,
        error: error.message,
        gateway: this.name
      }));

      return {
        success: false,
        totalSent: 0,
        totalFailed: messages.length,
        results,
        gateway: this.name
      };
    }
  }

  async getBalance(): Promise<GatewayBalance> {
    try {
      const response = await fetch(`${this.baseUrl}/credit/balance`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      const result = await response.json();

      if (response.ok) {
        return {
          credits: result.data?.balance || 0,
          currency: result.data?.currency || 'EUR',
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error(`Failed to get balance: ${result.error?.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/sms/status/${messageId}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Mapear status do BulkGate para nosso padrão
        let status: 'pending' | 'sent' | 'delivered' | 'failed' = 'pending';
        
        switch (result.data.status) {
          case 'sent':
            status = 'sent';
            break;
          case 'delivered':
            status = 'delivered';
            break;
          case 'failed':
          case 'rejected':
            status = 'failed';
            break;
          default:
            status = 'pending';
        }

        return {
          messageId,
          status,
          deliveredAt: result.data.delivered_at || undefined,
          error: status === 'failed' ? result.data.error : undefined
        };
      } else {
        throw new Error(`Failed to get status: ${result.error?.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  async validateSenderID(senderId: string): Promise<boolean> {
    try {
      // BulkGate tem endpoint específico para validar sender ID
      const response = await fetch(`${this.baseUrl}/sender-id/validate/${encodeURIComponent(senderId)}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      const result = await response.json();
      return response.ok && result.data?.valid === true;
    } catch {
      return false;
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/credit/balance`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}