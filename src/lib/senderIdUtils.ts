/**
 * ========================================
 * SENDER ID UTILITIES - MANDATO SMSAO
 * ========================================
 * 
 * Centralização da lógica de Sender ID para garantir
 * que "SMSAO" seja usado consistentemente em toda a plataforma.
 */

export const DEFAULT_SENDER_ID = 'SMSAO';
export const DEPRECATED_SENDER_IDS = ['ONSMS', 'SMS'];

/**
 * Helper principal para resolver Sender ID
 * SEMPRE retorna um sender ID válido, priorizando SMSAO
 */
export function resolveSenderId(input?: string | null): string {
  // Se não foi informado, usar padrão
  if (!input || input.trim() === '') {
    return DEFAULT_SENDER_ID;
  }

  const normalized = input.trim().toUpperCase();

  // Se foi informado um sender ID depreciado, substituir por SMSAO
  if (DEPRECATED_SENDER_IDS.includes(normalized)) {
    console.warn(`Sender ID depreciado detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }

  // Validar formato BulkSMS: alfanumérico, máximo 11 caracteres
  if (!isValidSenderIdFormat(normalized)) {
    console.warn(`Sender ID inválido detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }

  return normalized;
}

/**
 * Validar se o sender ID está no formato correto para BulkSMS
 * - Apenas caracteres alfanuméricos
 * - Máximo 11 caracteres
 */
export function isValidSenderIdFormat(senderId: string): boolean {
  if (!senderId || senderId.length === 0) return false;
  if (senderId.length > 11) return false;
  
  // Apenas letras e números
  return /^[A-Za-z0-9]+$/.test(senderId);
}

/**
 * Normalizar sender ID para uso em payloads de API
 * Remove espaços, converte para uppercase, aplica validações
 */
export function normalizeSenderIdForAPI(input?: string | null): string {
  return resolveSenderId(input);
}

/**
 * Filtrar lista de sender IDs, removendo depreciados e duplicados
 */
export function filterValidSenderIds(senderIds: any[]): any[] {
  if (!Array.isArray(senderIds)) return [];

  const seen = new Set<string>();
  return senderIds.filter(item => {
    if (!item?.sender_id) return false;
    
    const normalized = item.sender_id.toUpperCase();
    
    // Remover depreciados
    if (DEPRECATED_SENDER_IDS.includes(normalized)) return false;
    
    // Remover duplicados (case-insensitive)
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    
    return true;
  });
}

/**
 * Garantir que SMSAO sempre está disponível na lista
 * Usado nos dropdowns para mostrar SMSAO mesmo se não estiver salvo
 */
export function ensureSMSAOInList(senderIds: any[]): any[] {
  const filtered = filterValidSenderIds(senderIds);
  
  // Verificar se SMSAO já está na lista
  const hasSMSAO = filtered.some(item => 
    item.sender_id?.toUpperCase() === DEFAULT_SENDER_ID
  );
  
  if (!hasSMSAO) {
    // Adicionar SMSAO como primeiro item
    filtered.unshift({
      id: 'default-smsao',
      sender_id: DEFAULT_SENDER_ID,
      status: 'approved',
      is_default: true,
      bulksms_status: 'approved',
      display_name: `${DEFAULT_SENDER_ID} (Padrão)`
    });
  } else {
    // Marcar SMSAO existente como padrão
    const smsaoItem = filtered.find(item => 
      item.sender_id?.toUpperCase() === DEFAULT_SENDER_ID
    );
    if (smsaoItem) {
      smsaoItem.is_default = true;
      smsaoItem.display_name = smsaoItem.display_name?.includes('(Padrão)') 
        ? smsaoItem.display_name 
        : `${smsaoItem.sender_id} (Padrão)`;
    }
  }
  
  return filtered;
}

/**
 * Helper para logs e debugging
 */
export function logSenderIdResolution(original: string | null | undefined, resolved: string, context?: string) {
  if (original !== resolved) {
    console.log(`[SenderID] ${context || 'Unknown'}: "${original}" → "${resolved}"`);
  }
}

/**
 * Constantes para uso em componentes UI
 */
export const SENDER_ID_UI = {
  DEFAULT_LABEL: `${DEFAULT_SENDER_ID} (Padrão)`,
  PLACEHOLDER: 'Selecione o remetente',
  HELPER_TEXT: 'O remetente que aparecerá no SMS enviado',
  MAX_LENGTH: 11,
  VALIDATION_MESSAGE: 'Apenas letras e números, máximo 11 caracteres'
} as const;