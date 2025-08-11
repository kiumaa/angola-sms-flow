import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';

export class BulkSMSGateway implements SMSGateway {
  name = 'bulksms';
  displayName = 'BulkSMS';
  
  private tokenId: string;
  private tokenSecret: string;
  private baseUrl = 'https://api.bulksms.com/v1';

  constructor(tokenId: string, tokenSecret: string) {
    this.tokenId = tokenId;
    this.tokenSecret = tokenSecret;
  }

  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.tokenId}:${this.tokenSecret}`)}`;
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          messages: [{
            to: message.to,
            from: message.from,
            body: message.text
          }]
        })
      });

      const result = await response.json();

      if (response.ok && Array.isArray(result) && result[0]?.id) {
        return {
          success: true,
          messageId: result[0].id,
          gateway: this.name,
          cost: 1 // BulkSMS typically charges 1 credit per SMS
        };
      } else {
        return {
          success: false,
          error: result.detail || result.error?.description || `HTTP ${response.status}`,
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
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      const result = await response.json();

      if (response.ok && result.credits) {
        return {
          credits: result.credits.balance || 0,
          currency: 'USD',
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error(`Failed to get balance: ${result.detail || result.error?.description || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Mapear status do BulkSMS para nosso padrão
        let status: 'pending' | 'sent' | 'delivered' | 'failed' = 'pending';
        
        switch (result.status?.type) {
          case 'SENT':
            status = 'sent';
            break;
          case 'DELIVERED':
            status = 'delivered';
            break;
          case 'FAILED':
            status = 'failed';
            break;
          default:
            status = 'pending';
        }

        return {
          messageId,
          status,
          deliveredAt: result.status?.type === 'DELIVERED' ? new Date().toISOString() : undefined,
          error: result.status?.type === 'FAILED' ? result.status?.description : undefined
        };
      } else {
        throw new Error(`Failed to get status: ${result.detail || result.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  async validateSenderID(senderId: string): Promise<boolean> {
    try {
      // BulkSMS API v1 não tem endpoint específico para validar sender ID
      // Vamos fazer um teste de envio para um número fictício
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          messages: [{
            to: '+1234567890', // Número fictício para teste
            from: senderId,
            body: 'Test'
          }]
        })
      });

      // Se não der erro de sender ID inválido, consideramos válido
      return response.status !== 400;
    } catch {
      return false;
    }
  }

  async isConfigured(): Promise<boolean> {
    return !!(this.tokenId && this.tokenSecret);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Send OTP code via SMS with retry logic and timeout
   */
  async sendOtpCode(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const maxRetries = 3;
    const timeout = 10000; // 10 seconds
    const sender = process.env.SMS_DEFAULT_SENDER || 'SMSAO';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.getAuthHeader()
          },
          body: JSON.stringify({
            messages: [{
              to: phone,
              from: sender,
              content: `Seu código de acesso é: ${code}`
            }]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        if (response.ok && Array.isArray(result) && result[0]?.id) {
          return {
            success: true,
            messageId: result[0].id
          };
        } 

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            error: result.detail || result.error?.description || `HTTP ${response.status}`
          };
        }

        // Retry on 5xx errors
        if (attempt === maxRetries) {
          return {
            success: false,
            error: result.detail || result.error?.description || `HTTP ${response.status}`
          };
        }

        console.warn(`BulkSMS attempt ${attempt} failed, retrying...`, result);

      } catch (error) {
        // Retry on timeout or network errors, but not on final attempt
        if (attempt === maxRetries || (error.name !== 'AbortError' && !error.message.includes('fetch'))) {
          return {
            success: false,
            error: error.name === 'AbortError' ? 'Request timeout' : error.message
          };
        }

        console.warn(`BulkSMS attempt ${attempt} failed with error, retrying...`, error.message);
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded'
    };
  }
}