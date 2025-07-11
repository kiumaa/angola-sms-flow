export interface SMSMessage {
  to: string;
  from: string;
  text: string;
  campaignId?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  gateway: string;
}

export interface SMSBulkResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: SMSResult[];
  gateway: string;
}

export interface SMSStatus {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveredAt?: string;
  error?: string;
}

export interface GatewayBalance {
  credits: number;
  currency?: string;
  lastUpdated: string;
}

export interface GatewayConfig {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  apiEndpoint: string;
  authType: 'basic' | 'bearer';
}

export interface FallbackResult {
  finalResult: SMSResult;
  attempts: {
    gateway: string;
    result: SMSResult;
    timestamp: string;
  }[];
  fallbackUsed: boolean;
}