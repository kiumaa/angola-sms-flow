// Rate limiting utilities for Quick Send feature

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

/**
 * Simple in-memory rate limiter (for development/testing)
 * In production, this should use Redis or similar
 */
class MemoryRateLimit {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const fullKey = `${config.keyPrefix}:${key}`;
    
    const existing = this.requests.get(fullKey);
    
    if (!existing || now >= existing.resetTime) {
      // First request or window expired
      const resetTime = now + config.windowMs;
      this.requests.set(fullKey, { count: 1, resetTime });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime
      };
    }
    
    if (existing.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        error: `Rate limit exceeded. Try again in ${Math.ceil((existing.resetTime - now) / 1000)} seconds.`
      };
    }
    
    // Increment counter
    existing.count++;
    this.requests.set(fullKey, existing);
    
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now >= data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global instance
const memoryRateLimit = new MemoryRateLimit();

// Clean up every 5 minutes
setInterval(() => memoryRateLimit.cleanup(), 5 * 60 * 1000);

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  QUICK_SEND: {
    maxRequests: 1,
    windowMs: 5 * 1000, // 5 seconds
    keyPrefix: 'quick-send'
  },
  SMS_SEND: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'sms-send'
  },
  CONTACT_IMPORT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'contact-import'
  }
} as const;

/**
 * Check rate limit for a user and operation
 */
export function checkRateLimit(userId: string, operation: keyof typeof RATE_LIMITS): RateLimitResult {
  const config = RATE_LIMITS[operation];
  return memoryRateLimit.check(userId, config);
}

/**
 * Create rate limit headers for HTTP responses
 */
export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'X-RateLimit-Limit': result.allowed ? '1' : '0'
  };
}