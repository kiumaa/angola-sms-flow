import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';

export class AfricasTalkingGateway implements SMSGateway {
  name = 'africastalking';
  displayName = "Africa's Talking";
  
  private username: string;
  private apiKey: string;
  private baseUrl = 'https://api.africastalking.com/version1';

  constructor(username: string, apiKey: string) {
    this.username = username;
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apiKey': this.apiKey,
      'Accept': 'application/json'
    };
  }

  private encodeFormData(data: Record<string, any>): string {
    return Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const payload = {
        username: this.username,
        to: message.to,
        message: message.text,
        from: message.from || undefined // Optional sender ID
      };

      const response = await fetch(`${this.baseUrl}/messaging`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: this.encodeFormData(payload)
      });

      const result = await response.json();

      if (response.ok && result.SMSMessageData) {
        const recipients = result.SMSMessageData.Recipients;
        
        if (recipients && recipients.length > 0) {
          const recipient = recipients[0];
          
          if (recipient.status === 'Success') {
            return {
              success: true,
              messageId: recipient.messageId,
              gateway: this.name,
              cost: recipient.cost ? parseFloat(recipient.cost.replace(/[^\d.]/g, '')) : 1
            };
          } else {
            return {
              success: false,
              error: `SMS failed: ${recipient.status}`,
              gateway: this.name
            };
          }
        } else {
          return {
            success: false,
            error: 'No recipients found in response',
            gateway: this.name
          };
        }
      } else {
        return {
          success: false,
          error: result.SMSMessageData?.Message || `HTTP ${response.status}`,
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
      const response = await fetch(`${this.baseUrl}/user?username=${this.username}`, {
        headers: {
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.UserData) {
        const balance = result.UserData.balance || 'USD 0.00';
        const creditAmount = parseFloat(balance.replace(/[^\d.]/g, '')) || 0;
        const currency = balance.includes('USD') ? 'USD' : 'KES';

        return {
          credits: creditAmount,
          currency,
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error(`Failed to get balance: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/messaging?username=${this.username}&messageId=${messageId}`, {
        headers: {
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.SMSMessageData) {
        const recipients = result.SMSMessageData.Recipients;
        
        if (recipients && recipients.length > 0) {
          const recipient = recipients[0];
          
          // Mapear status do Africa's Talking para nosso padrão
          let status: 'pending' | 'sent' | 'delivered' | 'failed' = 'pending';
          
          switch (recipient.status) {
            case 'Success':
              status = 'sent';
              break;
            case 'Sent':
              status = 'sent';
              break;
            case 'Delivered':
              status = 'delivered';
              break;
            case 'Failed':
              status = 'failed';
              break;
            default:
              status = 'pending';
          }

          return {
            messageId,
            status,
            deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
            error: status === 'failed' ? recipient.status : undefined
          };
        }
      }
      
      throw new Error(`Failed to get status: ${result.message || 'Unknown error'}`);
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  async validateSenderID(senderId: string): Promise<boolean> {
    try {
      // Africa's Talking permite validar sender IDs através de um teste
      const payload = {
        username: this.username,
        to: '+254700000000', // Número de teste
        message: 'Test sender ID validation',
        from: senderId
      };

      const response = await fetch(`${this.baseUrl}/messaging`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: this.encodeFormData(payload)
      });

      const result = await response.json();
      
      // Se não houver erro relacionado ao sender ID, consideramos válido
      return response.ok && !result.SMSMessageData?.Message?.includes('sender');
    } catch {
      return false;
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!(this.username && this.apiKey);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user?username=${this.username}`, {
        headers: {
          'apiKey': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}