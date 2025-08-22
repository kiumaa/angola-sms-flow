/**
 * SMS Gateway Fallback System
 * Handles failed SMS sending attempts and prevents duplicate sends
 */

export interface SMSFallbackAttempt {
  id: string
  userId: string
  phoneE164: string
  message: string
  senderId: string
  gateway: string
  attempts: number
  lastAttemptAt: Date
  status: 'pending' | 'failed' | 'exhausted'
  errors: string[]
}

export interface GatewayStatus {
  name: string
  isAvailable: boolean
  lastError?: string
  lastChecked: Date
  consecutiveFailures: number
}

class SMSFallbackManager {
  private readonly MAX_ATTEMPTS = 3
  private readonly RETRY_DELAY_MS = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CONSECUTIVE_FAILURES = 5

  private gatewayStatus = new Map<string, GatewayStatus>()
  private failedAttempts = new Map<string, SMSFallbackAttempt>()

  /**
   * Register a gateway failure
   */
  registerFailure(
    gateway: string,
    userId: string,
    phoneE164: string,
    message: string,
    senderId: string,
    error: string
  ): void {
    const attemptKey = this.getAttemptKey(userId, phoneE164, message)
    
    // Update gateway status
    const status = this.gatewayStatus.get(gateway) || {
      name: gateway,
      isAvailable: true,
      lastChecked: new Date(),
      consecutiveFailures: 0
    }
    
    status.consecutiveFailures++
    status.lastError = error
    status.lastChecked = new Date()
    status.isAvailable = status.consecutiveFailures < this.MAX_CONSECUTIVE_FAILURES
    
    this.gatewayStatus.set(gateway, status)

    // Update failed attempt
    const attempt = this.failedAttempts.get(attemptKey) || {
      id: attemptKey,
      userId,
      phoneE164,
      message,
      senderId,
      gateway,
      attempts: 0,
      lastAttemptAt: new Date(),
      status: 'pending',
      errors: []
    }

    attempt.attempts++
    attempt.lastAttemptAt = new Date()
    attempt.errors.push(`${gateway}: ${error}`)
    
    if (attempt.attempts >= this.MAX_ATTEMPTS) {
      attempt.status = 'exhausted'
    } else {
      attempt.status = 'failed'
    }

    this.failedAttempts.set(attemptKey, attempt)

    console.error(`SMS Fallback: ${gateway} failed for ${phoneE164}. Attempt ${attempt.attempts}/${this.MAX_ATTEMPTS}`, error)
  }

  /**
   * Register a successful send to reset gateway status
   */
  registerSuccess(gateway: string): void {
    const status = this.gatewayStatus.get(gateway)
    if (status) {
      status.consecutiveFailures = 0
      status.isAvailable = true
      status.lastError = undefined
      status.lastChecked = new Date()
      this.gatewayStatus.set(gateway, status)
    }
  }

  /**
   * Check if a message can be retried
   */
  canRetry(userId: string, phoneE164: string, message: string): boolean {
    const attemptKey = this.getAttemptKey(userId, phoneE164, message)
    const attempt = this.failedAttempts.get(attemptKey)

    if (!attempt) return true
    if (attempt.status === 'exhausted') return false

    const timeSinceLastAttempt = Date.now() - attempt.lastAttemptAt.getTime()
    return timeSinceLastAttempt >= this.RETRY_DELAY_MS
  }

  /**
   * Check if a gateway is available
   */
  isGatewayAvailable(gateway: string): boolean {
    const status = this.gatewayStatus.get(gateway)
    return status?.isAvailable !== false
  }

  /**
   * Get available gateways in priority order
   */
  getAvailableGateways(): string[] {
    const gateways = ['bulksms', 'bulkgate'] // Priority order
    return gateways.filter(gateway => this.isGatewayAvailable(gateway))
  }

  /**
   * Get failed attempts for a user (for admin monitoring)
   */
  getFailedAttempts(userId?: string): SMSFallbackAttempt[] {
    const attempts = Array.from(this.failedAttempts.values())
    return userId ? attempts.filter(a => a.userId === userId) : attempts
  }

  /**
   * Get gateway status for monitoring
   */
  getGatewayStatus(): GatewayStatus[] {
    return Array.from(this.gatewayStatus.values())
  }

  /**
   * Clear old failed attempts (cleanup)
   */
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    for (const [key, attempt] of this.failedAttempts.entries()) {
      if (attempt.lastAttemptAt.getTime() < cutoff) {
        this.failedAttempts.delete(key)
      }
    }
  }

  /**
   * Generate unique key for an attempt
   */
  private getAttemptKey(userId: string, phoneE164: string, message: string): string {
    const messageHash = btoa(message).slice(0, 10) // Simple hash
    return `${userId}:${phoneE164}:${messageHash}`
  }

  /**
   * Generate user-friendly error message
   */
  getUserFriendlyError(gateway: string, error: string): string {
    const errorMappings = {
      'INSUFFICIENT_CREDITS': 'Créditos insuficientes no gateway SMS',
      'INVALID_SENDER_ID': 'ID do remetente inválido',
      'INVALID_PHONE': 'Número de telefone inválido',
      'NETWORK_ERROR': 'Erro de conexão. Tente novamente em alguns minutos',
      'RATE_LIMITED': 'Muitas tentativas. Aguarde alguns minutos',
      'BLOCKED_CONTENT': 'Conteúdo da mensagem foi bloqueado',
    }

    // Try to match known error patterns
    for (const [pattern, message] of Object.entries(errorMappings)) {
      if (error.toUpperCase().includes(pattern)) {
        return message
      }
    }

    // Generic fallback
    return 'Erro temporário no envio. Nossa equipe foi notificada'
  }

  /**
   * Get next available gateway for a message
   */
  getNextGateway(
    userId: string,
    phoneE164: string,
    message: string,
    excludeGateways: string[] = []
  ): string | null {
    const availableGateways = this.getAvailableGateways()
      .filter(gateway => !excludeGateways.includes(gateway))

    if (availableGateways.length === 0) {
      return null
    }

    // Return first available gateway
    return availableGateways[0]
  }
}

// Global instance
export const smsFallbackManager = new SMSFallbackManager()

// Auto-cleanup every hour
setInterval(() => {
  smsFallbackManager.cleanup()
}, 60 * 60 * 1000)

// Export types and manager
export { SMSFallbackManager }