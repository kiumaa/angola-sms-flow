import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, FallbackResult, GatewayConfig } from '../interfaces/SMSTypes';
import { RouteeGateway } from '../gateways/RouteeGateway';

export class SMSGatewayManager {
  private gateways: Map<string, SMSGateway> = new Map();
  private configs: GatewayConfig[] = [];

  constructor() {
    // Os gateways serão inicializados quando as credenciais estiverem disponíveis
  }

  /**
   * Inicializa gateways com credenciais - usando apenas Routee
   */
  async initialize(credentials: {
    routeeApplicationId?: string;
    routeeApplicationSecret?: string;
  }): Promise<void> {
    // Limpar gateways existentes
    this.gateways.clear();

    // Inicializar Routee como gateway exclusivo
    if (credentials.routeeApplicationId && credentials.routeeApplicationSecret) {
      const routeeGateway = new RouteeGateway(credentials.routeeApplicationId, credentials.routeeApplicationSecret);
      this.gateways.set('routee', routeeGateway);
    }
  }

  /**
   * Define as configurações dos gateways
   */
  setConfigs(configs: GatewayConfig[]): void {
    this.configs = configs;
  }

  /**
   * Obtém o gateway primário ativo
   */
  private getPrimaryGateway(): SMSGateway | null {
    const primaryConfig = this.configs.find(c => c.isPrimary && c.isActive);
    if (!primaryConfig) return null;

    return this.gateways.get(primaryConfig.name) || null;
  }

  /**
   * Obtém o gateway de fallback ativo
   */
  private getFallbackGateway(): SMSGateway | null {
    const activeConfigs = this.configs.filter(c => c.isActive && !c.isPrimary);
    if (activeConfigs.length === 0) return null;

    // Retorna o primeiro gateway ativo que não é primário
    return this.gateways.get(activeConfigs[0].name) || null;
  }

  /**
   * Determina se deve tentar fallback baseado no erro
   */
  private shouldFallback(error: string, statusCode?: number): boolean {
    // Casos em que devemos tentar fallback
    const fallbackErrors = [
      'insufficient credits',
      'saldo insuficiente',
      'sender id not approved',
      'timeout',
      'connection failed',
      'server error',
      'rate limit'
    ];

    // Códigos HTTP que indicam necessidade de fallback
    const fallbackCodes = [402, 403, 429, 500, 502, 503, 504];

    const errorLower = error.toLowerCase();
    const shouldFallbackOnError = fallbackErrors.some(err => errorLower.includes(err));
    const shouldFallbackOnCode = statusCode ? fallbackCodes.includes(statusCode) : false;

    return shouldFallbackOnError || shouldFallbackOnCode;
  }

  /**
   * Envia SMS com fallback automático
   */
  async sendWithFallback(message: SMSMessage): Promise<FallbackResult> {
    const attempts: FallbackResult['attempts'] = [];
    let finalResult: SMSResult;
    let fallbackUsed = false;

    const primaryGateway = this.getPrimaryGateway();
    const fallbackGateway = this.getFallbackGateway();

    if (!primaryGateway) {
      throw new Error('No primary gateway configured');
    }

    try {
      // Tentativa 1: Gateway primário
      console.log(`Attempting to send SMS via primary gateway: ${primaryGateway.name}`);
      const primaryResult = await primaryGateway.sendSingle(message);
      
      attempts.push({
        gateway: primaryGateway.name,
        result: primaryResult,
        timestamp: new Date().toISOString()
      });

      if (primaryResult.success) {
        // Sucesso no gateway primário
        finalResult = primaryResult;
      } else {
        // Falha no gateway primário - verificar se deve tentar fallback
        console.log(`Primary gateway failed: ${primaryResult.error}`);
        
        if (fallbackGateway && this.shouldFallback(primaryResult.error || '')) {
          console.log(`Attempting fallback to: ${fallbackGateway.name}`);
          fallbackUsed = true;
          
          try {
            // Tentativa 2: Gateway de fallback
            const fallbackResult = await fallbackGateway.sendSingle(message);
            
            attempts.push({
              gateway: fallbackGateway.name,
              result: fallbackResult,
              timestamp: new Date().toISOString()
            });

            finalResult = fallbackResult;
          } catch (fallbackError) {
            // Fallback também falhou
            const fallbackResult: SMSResult = {
              success: false,
              error: fallbackError.message,
              gateway: fallbackGateway.name
            };

            attempts.push({
              gateway: fallbackGateway.name,
              result: fallbackResult,
              timestamp: new Date().toISOString()
            });

            finalResult = fallbackResult;
          }
        } else {
          // Não tentar fallback
          finalResult = primaryResult;
        }
      }
    } catch (primaryError) {
      // Erro de conexão/exceção no gateway primário
      const primaryResult: SMSResult = {
        success: false,
        error: primaryError.message,
        gateway: primaryGateway.name
      };

      attempts.push({
        gateway: primaryGateway.name,
        result: primaryResult,
        timestamp: new Date().toISOString()
      });

      if (fallbackGateway && this.shouldFallback(primaryError.message)) {
        console.log(`Primary gateway exception, attempting fallback to: ${fallbackGateway.name}`);
        fallbackUsed = true;
        
        try {
          const fallbackResult = await fallbackGateway.sendSingle(message);
          
          attempts.push({
            gateway: fallbackGateway.name,
            result: fallbackResult,
            timestamp: new Date().toISOString()
          });

          finalResult = fallbackResult;
        } catch (fallbackError) {
          const fallbackResult: SMSResult = {
            success: false,
            error: fallbackError.message,
            gateway: fallbackGateway.name
          };

          attempts.push({
            gateway: fallbackGateway.name,
            result: fallbackResult,
            timestamp: new Date().toISOString()
          });

          finalResult = fallbackResult;
        }
      } else {
        finalResult = primaryResult;
      }
    }

    return {
      finalResult,
      attempts,
      fallbackUsed
    };
  }

  /**
   * Envia múltiplos SMS com fallback
   */
  async sendBulkWithFallback(messages: SMSMessage[]): Promise<FallbackResult[]> {
    const results: FallbackResult[] = [];

    for (const message of messages) {
      const result = await this.sendWithFallback(message);
      results.push(result);
    }

    return results;
  }

  /**
   * Obtém saldo de um gateway específico
   */
  async getGatewayBalance(gatewayName: string) {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new Error(`Gateway ${gatewayName} not found`);
    }

    return await gateway.getBalance();
  }

  /**
   * Testa conectividade de um gateway específico
   */
  async testGatewayConnection(gatewayName: string): Promise<boolean> {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      return false;
    }

    return await gateway.testConnection();
  }

  /**
   * Valida sender ID em um gateway específico
   */
  async validateSenderID(gatewayName: string, senderId: string): Promise<boolean> {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      return false;
    }

    return await gateway.validateSenderID(senderId);
  }

  /**
   * Obtém status de uma mensagem
   */
  async getMessageStatus(gatewayName: string, messageId: string) {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      throw new Error(`Gateway ${gatewayName} not found`);
    }

    return await gateway.getStatus(messageId);
  }

  /**
   * Lista gateways disponíveis
   */
  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }

  /**
   * Verifica se um gateway está configurado
   */
  async isGatewayConfigured(gatewayName: string): Promise<boolean> {
    const gateway = this.gateways.get(gatewayName);
    if (!gateway) {
      return false;
    }

    return await gateway.isConfigured();
  }
}