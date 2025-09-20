/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"'`]/g, '') // Remove dangerous characters
    .trim(); // Remove whitespace
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+244[9][0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if text contains potential XSS attempts
 */
export const containsXSS = (text: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /vbscript:/i,
    /data:text\/html/i
  ];
  
  return xssPatterns.some(pattern => pattern.test(text));
};

/**
 * Enhanced rate limiting helper for client-side with security logging
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 5 * 60 * 1000 // 5 minutes
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      // Security: Log rate limit violations
      console.warn(`Rate limit exceeded for key: ${key.substring(0, 8)}...`, {
        attempts: validAttempts.length,
        maxAttempts: this.maxAttempts,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }

  // Security: Get remaining attempts for user feedback
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  // Security: Get time until reset
  getTimeUntilReset(key: string): number {
    const attempts = this.attempts.get(key);
    if (!attempts || attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

/**
 * Generate secure random strings
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};