import { SMSGateway } from '../interfaces/SMSGateway';
import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from '../interfaces/SMSTypes';

export class RouteeGateway implements SMSGateway {
  name = 'routee';
  displayName = 'Routee (AMD Telecom)';
  
  private applicationId: string;
  private applicationSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private baseUrl = 'https://connect.routee.net';

  constructor(applicationId: string, applicationSecret: string) {
    this.applicationId = applicationId;
    this.applicationSecret = applicationSecret;
  }

  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Request new token via OAuth 2.0
    const tokenResponse = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.applicationId,
        client_secret: this.applicationSecret
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    this.accessToken = tokenData.access_token;
    
    // Set expiration time (subtract 60 seconds for safety)
    const expiresIn = tokenData.expires_in || 3600;
    this.tokenExpiresAt = new Date(Date.now() + (expiresIn - 60) * 1000);

    return this.accessToken;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
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
      const headers = await this.getHeaders();
      
      // Payload conforme documentação oficial do Routee
      const payload = {
        body: message.text,
        to: formattedTo, // String, não array
        from: message.from || 'SMS.AO',
        callback: {
          url: `${process.env.SUPABASE_URL || 'https://hwxxcprqxqznselwzghi.supabase.co'}/functions/v1/routee-webhook`,
          strategy: 'OnChange'
        }
      };

      const response = await fetch(`${this.baseUrl}/sms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Routee API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      // Calcular custo baseado no número de partes
      const cost = data.bodyAnalysis?.parts || 1;
      
      return {
        success: true,
        messageId: data.trackingId,
        gateway: this.name,
        cost
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
    return Boolean(this.applicationId && this.applicationSecret);
  }

  async testConnection(): Promise<boolean> {
    try {
      // Teste simples de conectividade com OAuth
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/sms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          body: 'Test connection',
          to: '+244900000000', // String conforme documentação
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