// Main exports for SMS Gateway system
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

// Utility function to create gateway manager with environment variables
export async function createSMSGatewayManager(env: Record<string, string | undefined>) {
  const { SMSGatewayManager } = await import('./manager/SMSGatewayManager');
  const manager = new SMSGatewayManager();
  
  // Initialize with available credentials
  await manager.initialize({
    bulksmsTokenId: env.BULKSMS_TOKEN_ID,
    bulksmsTokenSecret: env.BULKSMS_TOKEN_SECRET,
    bulkgateApiKey: env.BULKGATE_API_KEY
  });
  
  return manager;
}