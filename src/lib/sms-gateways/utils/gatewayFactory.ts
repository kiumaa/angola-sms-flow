import { SMSGateway } from '../interfaces/SMSGateway';
import { BulkSMSGateway } from '../gateways/BulkSMSGateway';
import { BulkGateGateway } from '../gateways/BulkGateGateway';

export interface GatewayCredentials {
  tokenId?: string;
  tokenSecret?: string;
  apiKey?: string;
}

export class GatewayFactory {
  static createGateway(type: string, credentials: GatewayCredentials): SMSGateway {
    switch (type.toLowerCase()) {
      case 'bulksms':
        if (!credentials.tokenId || !credentials.tokenSecret) {
          throw new Error('BulkSMS requires tokenId and tokenSecret');
        }
        return new BulkSMSGateway(credentials.tokenId, credentials.tokenSecret);

      case 'bulkgate':
        if (!credentials.apiKey) {
          throw new Error('BulkGate requires apiKey');
        }
        return new BulkGateGateway(credentials.apiKey);

      default:
        throw new Error(`Unsupported gateway type: ${type}`);
    }
  }

  static async createFromSecrets(
    type: string,
    getSecret: (name: string) => Promise<string | null>
  ): Promise<SMSGateway> {
    switch (type.toLowerCase()) {
      case 'bulksms':
        const tokenId = await getSecret('BULKSMS_TOKEN_ID');
        const tokenSecret = await getSecret('BULKSMS_TOKEN_SECRET');
        
        if (!tokenId || !tokenSecret) {
          throw new Error('BulkSMS credentials not found in secrets');
        }
        
        return new BulkSMSGateway(tokenId, tokenSecret);

      case 'bulkgate':
        const apiKey = await getSecret('BULKGATE_API_KEY');
        
        if (!apiKey) {
          throw new Error('BulkGate API key not found in secrets');
        }
        
        return new BulkGateGateway(apiKey);

      default:
        throw new Error(`Unsupported gateway type: ${type}`);
    }
  }

  static getSupportedGateways(): string[] {
    return ['bulksms', 'bulkgate'];
  }

  static validateCredentials(type: string, credentials: GatewayCredentials): boolean {
    switch (type.toLowerCase()) {
      case 'bulksms':
        return Boolean(credentials.tokenId && credentials.tokenSecret);
      
      case 'bulkgate':
        return Boolean(credentials.apiKey);
      
      default:
        return false;
    }
  }

  static async testGateway(gateway: SMSGateway): Promise<{
    configured: boolean;
    connected: boolean;
    balance?: number;
    error?: string;
  }> {
    try {
      const configured = await gateway.isConfigured();
      
      if (!configured) {
        return {
          configured: false,
          connected: false,
          error: 'Gateway not configured'
        };
      }

      const connected = await gateway.testConnection();
      
      if (!connected) {
        return {
          configured: true,
          connected: false,
          error: 'Gateway connection failed'
        };
      }

      // Try to get balance
      let balance: number | undefined;
      try {
        const balanceInfo = await gateway.getBalance();
        balance = balanceInfo.credits;
      } catch (error) {
        // Balance might not be available, but gateway is still working
        console.warn(`Could not fetch balance for ${gateway.name}:`, error);
      }

      return {
        configured: true,
        connected: true,
        balance
      };
    } catch (error) {
      return {
        configured: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}