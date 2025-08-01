// Main exports for SMS Gateway system
export { SMSGatewayManager } from './manager/SMSGatewayManager';
export { RouteeGateway } from './gateways/RouteeGateway';
// Legacy gateways (archived)
// export { BulkSMSGateway } from './gateways/BulkSMSGateway';
// export { BulkGateGateway } from './gateways/BulkGateGateway';
// export { AfricasTalkingGateway } from './gateways/AfricasTalkingGateway';

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
  
  // Initialize with Routee credentials only
  await manager.initialize({
    routeeApplicationId: env.ROUTEE_APPLICATION_ID,
    routeeApplicationSecret: env.ROUTEE_APPLICATION_SECRET
  });
  
  return manager;
}