// OTP Request Types and Models
export interface OTPRequest {
  id: string;
  user_id?: string;
  phone: string;
  code: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

export interface CreateOTPRequest {
  user_id?: string;
  phone: string;
  code: string;
  expires_at?: string; // Optional, will be auto-calculated if not provided
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

// OTP Request Model class with helper methods
export class OTPRequestModel {
  static readonly EXPIRY_MINUTES = 5;

  /**
   * Calculate expiration timestamp (5 minutes from now)
   */
  static calculateExpiresAt(createdAt: Date = new Date()): string {
    const expiresAt = new Date(createdAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);
    return expiresAt.toISOString();
  }

  /**
   * Generate a random 6-digit OTP code
   */
  static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if OTP request has expired
   */
  static isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Check if OTP request is valid (not expired and not used)
   */
  static isValid(otpRequest: OTPRequest): boolean {
    return !otpRequest.used && !this.isExpired(otpRequest.expires_at);
  }

  /**
   * Create OTP request payload with auto-calculated expiration
   */
  static createRequestPayload(phone: string, userId?: string): CreateOTPRequest {
    const createdAt = new Date();
    return {
      user_id: userId,
      phone,
      code: this.generateOTPCode(),
      expires_at: this.calculateExpiresAt(createdAt)
    };
  }
}

// Constants for OTP functionality
export const OTP_CONSTANTS = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS_PER_HOUR: 5,
  CLEANUP_INTERVAL_HOURS: 24
} as const;