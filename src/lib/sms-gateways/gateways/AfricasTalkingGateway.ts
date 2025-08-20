// Stub implementation for Africa's Talking Gateway
// This gateway has been removed from the project.

import type { SMSMessage, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';
import type { SMSGateway } from '../interfaces/SMSGateway';

export class AfricasTalkingGateway implements SMSGateway {
  name = 'africastalking';
  displayName = "Africa's Talking (Removed)";

  constructor() {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async sendSingle(message: SMSMessage): Promise<SMSStatus> {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult> {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async getBalance(): Promise<GatewayBalance> {
    return { balance: 0 } as GatewayBalance;
  }
}
