// Stub implementation for Africa's Talking Gateway
// This gateway has been removed from the project.

import type { SMSMessage, SMSBulkResult, SMSStatus, GatewayBalance, SMSResult } from '../interfaces/SMSTypes';
import type { SMSGateway } from '../interfaces/SMSGateway';

export class AfricasTalkingGateway implements SMSGateway {
  name = 'africastalking';
  displayName = "Africa's Talking (Removed)";

  constructor() {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult> {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async getBalance(): Promise<GatewayBalance> {
    return { credits: 0, lastUpdated: new Date().toISOString() };
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async validateSenderID(senderId: string): Promise<boolean> {
    throw new Error("Africa's Talking SMS Gateway has been removed from this project.");
  }

  async isConfigured(): Promise<boolean> {
    return false;
  }

  async testConnection(): Promise<boolean> {
    return false;
  }
}
