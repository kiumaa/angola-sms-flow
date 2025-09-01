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
      const response = await fetch(`${this.baseUrl}/simple/transactional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: this.apiKey,
          application_token: this.apiKey,
          number: message.to,
          text: message.text,
          sender_id: message.from,
          sender_id_value: message.from
        })
      });

      const data = await response.json();
      
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
      const response = await fetch(`${this.baseUrl}/info/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: this.apiKey,
          application_token: this.apiKey
        })
      });

      const data = await response.json();
      
      if (response.ok && data.data) {
        return {
          credits: data.data.credit || 0,
          currency: 'EUR',
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error(data.error?.message || 'Failed to get balance');
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
      // BulkGate allows custom sender IDs with validation
      // For now, we'll allow alphanumeric sender IDs up to 11 characters
      return /^[a-zA-Z0-9]{1,11}$/.test(senderId);
    } catch (error) {
      return false;
    }
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