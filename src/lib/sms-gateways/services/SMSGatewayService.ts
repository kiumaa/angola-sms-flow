import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, FallbackResult } from '../interfaces/SMSTypes';
import { BulkSMSGateway } from '../gateways/BulkSMSGateway';
import { BulkGateGateway } from '../gateways/BulkGateGateway';
import { CountryRoutingService } from './CountryRoutingService';

export interface GatewayCredentials {
  bulksms?: {
    tokenId: string;
    tokenSecret: string;
  };
  bulkgate?: {
    apiKey: string;
  };
}

export interface RoutingConfig {
  primaryGateway: string;
  fallbackGateway?: string;
  countrySpecificRouting: Record<string, string>;
  maxRetries: number;
  retryDelay: number;
}

export class SMSGatewayService {
  private gateways: Map<string, SMSGateway> = new Map();
  private routingService: CountryRoutingService;
  private config: RoutingConfig;

  constructor(credentials: GatewayCredentials, routingConfig?: Partial<RoutingConfig>) {
    this.config = {
      primaryGateway: 'bulksms',
      fallbackGateway: 'bulkgate',
      countrySpecificRouting: {
        'AO': 'bulkgate', // Angola -> BulkGate
        'PT': 'bulksms',  // Portugal -> BulkSMS
        'BR': 'bulksms',  // Brazil -> BulkSMS
      },
      maxRetries: 2,
      retryDelay: 1000,
      ...routingConfig
    };

    this.initializeGateways(credentials);
    this.routingService = new CountryRoutingService();
  }

  private initializeGateways(credentials: GatewayCredentials) {
    // Initialize BulkSMS
    if (credentials.bulksms) {
      const bulkSMSGateway = new BulkSMSGateway(
        credentials.bulksms.tokenId,
        credentials.bulksms.tokenSecret
      );
      this.gateways.set('bulksms', bulkSMSGateway);
    }

    // Initialize BulkGate
    if (credentials.bulkgate) {
      const bulkGateGateway = new BulkGateGateway(credentials.bulkgate.apiKey);
      this.gateways.set('bulkgate', bulkGateGateway);
    }
  }

  async sendWithIntelligentRouting(message: SMSMessage): Promise<FallbackResult> {
    const attempts: FallbackResult['attempts'] = [];
    let finalResult: SMSResult;
    let fallbackUsed = false;

    // Determine the best gateway for this message
    const countryCode = this.routingService.detectCountryFromPhone(message.to);
    const recommendedGateway = this.selectGatewayForCountry(countryCode);
    
    // Gateway selected based on country

    // Try primary (recommended) gateway
    const primaryGateway = this.gateways.get(recommendedGateway);
    if (primaryGateway) {
      const primaryResult = await this.attemptSend(primaryGateway, message);
      attempts.push({
        gateway: recommendedGateway,
        result: primaryResult,
        timestamp: new Date().toISOString()
      });

      if (primaryResult.success) {
        finalResult = primaryResult;
      } else {
        // Try fallback gateway
        const fallbackGatewayName = this.getFallbackGateway(recommendedGateway);
        const fallbackGateway = this.gateways.get(fallbackGatewayName);
        
        if (fallbackGateway) {
          // Attempting fallback gateway
          fallbackUsed = true;
          
          const fallbackResult = await this.attemptSend(fallbackGateway, message);
          attempts.push({
            gateway: fallbackGatewayName,
            result: fallbackResult,
            timestamp: new Date().toISOString()
          });
          
          finalResult = fallbackResult;
        } else {
          finalResult = primaryResult;
        }
      }
    } else {
      finalResult = {
        success: false,
        error: `Gateway ${recommendedGateway} not available`,
        gateway: recommendedGateway
      };
    }

    return {
      finalResult,
      attempts,
      fallbackUsed
    };
  }

  private selectGatewayForCountry(countryCode: string): string {
    // Check country-specific routing first
    if (this.config.countrySpecificRouting[countryCode]) {
      return this.config.countrySpecificRouting[countryCode];
    }

    // Fall back to primary gateway
    return this.config.primaryGateway;
  }

  private getFallbackGateway(primaryGateway: string): string {
    // If primary is BulkGate, fallback to BulkSMS and vice versa
    if (primaryGateway === 'bulkgate') {
      return 'bulksms';
    } else if (primaryGateway === 'bulksms') {
      return 'bulkgate';
    }
    
    return this.config.fallbackGateway || 'bulksms';
  }

  private async attemptSend(gateway: SMSGateway, message: SMSMessage): Promise<SMSResult> {
    try {
      // Check if gateway is configured and available
      const isConfigured = await gateway.isConfigured();
      if (!isConfigured) {
        return {
          success: false,
          error: `Gateway ${gateway.name} is not properly configured`,
          gateway: gateway.name
        };
      }

      // Test connection first
      const isConnected = await gateway.testConnection();
      if (!isConnected) {
        return {
          success: false,
          error: `Gateway ${gateway.name} connection failed`,
          gateway: gateway.name
        };
      }

      // Send the message
      return await gateway.sendSingle(message);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        gateway: gateway.name
      };
    }
  }

  async getGatewayStatus(gatewayName: string): Promise<{
    name: string;
    available: boolean;
    configured: boolean;
    balance?: number;
    error?: string;
  }> {
    const gateway = this.gateways.get(gatewayName);
    
    if (!gateway) {
      return {
        name: gatewayName,
        available: false,
        configured: false,
        error: 'Gateway not found'
      };
    }

    try {
      const configured = await gateway.isConfigured();
      const available = configured ? await gateway.testConnection() : false;
      
      let balance: number | undefined;
      if (available) {
        try {
          const balanceInfo = await gateway.getBalance();
          balance = balanceInfo.credits;
        } catch (error) {
          console.warn(`Failed to get balance for ${gatewayName}:`, error);
        }
      }

      return {
        name: gatewayName,
        available,
        configured,
        balance
      };
    } catch (error) {
      return {
        name: gatewayName,
        available: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAllGatewayStatuses() {
    const statuses = await Promise.all(
      Array.from(this.gateways.keys()).map(name => this.getGatewayStatus(name))
    );
    
    return statuses;
  }

  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  updateRoutingConfig(newConfig: Partial<RoutingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}