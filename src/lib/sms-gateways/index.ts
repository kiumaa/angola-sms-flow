// Interfaces
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

// Gateway implementations
export { BulkSMSGateway } from './gateways/BulkSMSGateway';
export { BulkGateGateway } from './gateways/BulkGateGateway';

// Services
export { SMSGatewayService } from './services/SMSGatewayService';
export { CountryRoutingService } from './services/CountryRoutingService';

// Utils
export { GatewayFactory } from './utils/gatewayFactory';

// Main service instance creator
import { SMSGatewayService } from './services/SMSGatewayService';

export const createSMSGatewayService = async (getSecret: (name: string) => Promise<string | null>) => {
  const credentials = {
    bulksms: {
      tokenId: await getSecret('BULKSMS_TOKEN_ID') || '',
      tokenSecret: await getSecret('BULKSMS_TOKEN_SECRET') || ''
    },
    bulkgate: {
      apiKey: await getSecret('BULKGATE_API_KEY') || ''
    }
  };

  const routingConfig = {
    primaryGateway: 'bulksms',
    fallbackGateway: 'bulkgate',
    countrySpecificRouting: {
      'AO': 'bulkgate', // Angola prefers BulkGate
      'MZ': 'bulkgate', // Mozambique prefers BulkGate
      'CV': 'bulkgate', // Cape Verde prefers BulkGate
      'GW': 'bulkgate', // Guinea-Bissau prefers BulkGate
      'ST': 'bulkgate', // São Tomé prefers BulkGate
      'TL': 'bulkgate', // East Timor prefers BulkGate
    },
    maxRetries: 2,
    retryDelay: 1000
  };

  return new SMSGatewayService(credentials, routingConfig);
};