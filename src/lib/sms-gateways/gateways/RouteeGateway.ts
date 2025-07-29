import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';

export class RouteeGateway implements SMSGateway {
  name = 'routee';
  displayName = 'Routee (AMD Telecom)';
  
  private apiToken: string;
  private baseUrl = 'https://connect.routee.net';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Garantir formato internacional (+244 para Angola)
    if (!phone.startsWith('+244') && !phone.startsWith('244')) {
      return `+244${phone.replace(/^0+/, '')}`;
    }
    return phone.startsWith('+') ? phone : `+${phone}`;
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const formattedTo = this.formatPhoneNumber(message.to);
      
      const payload = {
        body: message.text,
        to: [formattedTo],
        from: message.from || 'SMS.AO'
      };

      const response = await fetch(`${this.baseUrl}/sms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Routee API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        messageId: data.trackingId || data.messageId || `routee_${Date.now()}`,
        gateway: this.name
      };
    } catch (error) {
      return {
        success: false,
        messageId: '',
        gateway: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult> {
    const results: SMSResult[] = [];
    let totalCost = 0;
    let successCount = 0;
    let failedCount = 0;

    // Routee não tem endpoint de bulk oficial, enviar um por vez
    for (const message of messages) {
      const result = await this.sendSingle(message);
      results.push(result);
      
      if (result.success) {
        successCount++;
        totalCost += result.cost || 1;
      } else {
        failedCount++;
      }
    }

    return {
      success: successCount > 0,
      results,
      totalSent: successCount,
      totalFailed: failedCount,
      gateway: this.name
    };
  }

  async getBalance(): Promise<GatewayBalance> {
    try {
      // Routee não expõe endpoint público de saldo
      // Retornar informação mockada ou chamar endpoint específico se disponível
      return {
        credits: 0,
        currency: 'EUR',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatus(messageId: string): Promise<SMSStatus> {
    try {
      // Implementar consulta de status se disponível na API do Routee
      // Por enquanto, retornar status baseado em webhook
      return {
        messageId,
        status: 'sent'
      };
    } catch (error) {
      return {
        messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateSenderID(senderId: string): Promise<boolean> {
    // Routee permite qualquer sender ID alfanumérico
    const alphanumericRegex = /^[a-zA-Z0-9]{1,11}$/;
    return alphanumericRegex.test(senderId);
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.apiToken);
  }

  async testConnection(): Promise<boolean> {
    try {
      // Teste simples de conectividade
      const response = await fetch(`${this.baseUrl}/sms`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          body: 'Test connection',
          to: ['+244900000000'], // Número de teste
          from: 'TEST'
        })
      });

      // Considerar sucesso se não for erro de autenticação
      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      return false;
    }
  }
}