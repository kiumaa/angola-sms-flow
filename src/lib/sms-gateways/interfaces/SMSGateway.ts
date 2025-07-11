import { SMSMessage, SMSResult, SMSBulkResult, SMSStatus, GatewayBalance } from './SMSTypes';

export interface SMSGateway {
  name: string;
  displayName: string;
  
  /**
   * Envia SMS individual
   */
  sendSingle(message: SMSMessage): Promise<SMSResult>;
  
  /**
   * Envia SMS em lote
   */
  sendBulk(messages: SMSMessage[]): Promise<SMSBulkResult>;
  
  /**
   * Consulta saldo do gateway
   */
  getBalance(): Promise<GatewayBalance>;
  
  /**
   * Consulta status de uma mensagem
   */
  getStatus(messageId: string): Promise<SMSStatus>;
  
  /**
   * Valida se um sender ID está aprovado
   */
  validateSenderID(senderId: string): Promise<boolean>;
  
  /**
   * Verifica se o gateway está configurado e funcional
   */
  isConfigured(): Promise<boolean>;
  
  /**
   * Testa conectividade com o gateway
   */
  testConnection(): Promise<boolean>;
}