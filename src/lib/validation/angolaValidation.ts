/**
 * Validações específicas para números de telefone angolanos
 */

export class AngolaPhoneValidator {
  // Prefixos válidos para operadoras angolanas
  private static readonly VALID_PREFIXES = [
    '9', // Todos os números móveis em Angola começam com 9
  ];

  // Operadoras angolanas e seus prefixos específicos
  private static readonly OPERATORS = {
    UNITEL: ['923', '924', '925', '926', '927'],
    MOVICEL: ['921', '922', '928', '929'],
    AFRICELL: ['920']
  };

  /**
   * Valida se o número é um número móvel angolano válido
   */
  static isValidAngolanMobile(phoneNumber: string): boolean {
    // Remove espaços, traços e parênteses
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Padrões aceitos:
    // +244XXXXXXXXX (formato internacional)
    // 244XXXXXXXXX (formato internacional sem +)
    // 9XXXXXXXX (formato nacional)
    
    if (cleaned.startsWith('+244')) {
      const national = cleaned.substring(4);
      return this.validateNationalFormat(national);
    }
    
    if (cleaned.startsWith('244')) {
      const national = cleaned.substring(3);
      return this.validateNationalFormat(national);
    }
    
    if (cleaned.startsWith('9') && cleaned.length === 9) {
      return this.validateNationalFormat(cleaned);
    }
    
    return false;
  }

  /**
   * Valida formato nacional (9XXXXXXXX)
   */
  private static validateNationalFormat(national: string): boolean {
    // Deve ter exatamente 9 dígitos
    if (national.length !== 9) return false;
    
    // Deve começar com 9
    if (!national.startsWith('9')) return false;
    
    // Deve conter apenas dígitos
    if (!/^\d{9}$/.test(national)) return false;
    
    // Verifica se o prefixo de 3 dígitos é válido
    const prefix = national.substring(0, 3);
    const allValidPrefixes = [
      ...this.OPERATORS.UNITEL,
      ...this.OPERATORS.MOVICEL,
      ...this.OPERATORS.AFRICELL
    ];
    
    return allValidPrefixes.includes(prefix);
  }

  /**
   * Normaliza um número angolano para formato E.164
   */
  static normalizeToE164(phoneNumber: string): string | null {
    if (!this.isValidAngolanMobile(phoneNumber)) {
      return null;
    }

    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+244')) {
      return cleaned;
    }
    
    if (cleaned.startsWith('244')) {
      return '+' + cleaned;
    }
    
    if (cleaned.startsWith('9') && cleaned.length === 9) {
      return '+244' + cleaned;
    }
    
    return null;
  }

  /**
   * Identifica a operadora do número
   */
  static getOperator(phoneNumber: string): string | null {
    if (!this.isValidAngolanMobile(phoneNumber)) {
      return null;
    }

    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    let national: string;
    
    if (cleaned.startsWith('+244')) {
      national = cleaned.substring(4);
    } else if (cleaned.startsWith('244')) {
      national = cleaned.substring(3);
    } else {
      national = cleaned;
    }

    const prefix = national.substring(0, 3);
    
    for (const [operator, prefixes] of Object.entries(this.OPERATORS)) {
      if (prefixes.includes(prefix)) {
        return operator;
      }
    }
    
    return null;
  }

  /**
   * Formata um número para exibição amigável
   */
  static formatForDisplay(phoneNumber: string): string | null {
    const e164 = this.normalizeToE164(phoneNumber);
    if (!e164) return null;
    
    // +244 9XX XXX XXX
    const national = e164.substring(4);
    return `+244 ${national.substring(0, 3)} ${national.substring(3, 6)} ${national.substring(6)}`;
  }

  /**
   * Valida múltiplos números
   */
  static validateBatch(phoneNumbers: string[]): {
    valid: string[];
    invalid: string[];
    summary: {
      total: number;
      validCount: number;
      invalidCount: number;
      operators: Record<string, number>;
    };
  } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const operators: Record<string, number> = {};
    
    phoneNumbers.forEach(phone => {
      if (this.isValidAngolanMobile(phone)) {
        valid.push(phone);
        const operator = this.getOperator(phone);
        if (operator) {
          operators[operator] = (operators[operator] || 0) + 1;
        }
      } else {
        invalid.push(phone);
      }
    });
    
    return {
      valid,
      invalid,
      summary: {
        total: phoneNumbers.length,
        validCount: valid.length,
        invalidCount: invalid.length,
        operators
      }
    };
  }
}

/**
 * Validações para Sender IDs específicos de Angola
 */
export class AngolaSenderIDValidator {
  /**
   * Valida se um Sender ID é apropriado para uso em Angola
   */
  static isValidForAngola(senderId: string): {
    valid: boolean;
    reason?: string;
    suggestions?: string[];
  } {
    // Remove espaços extras
    const cleaned = senderId.trim();
    
    // Verifica comprimento
    if (cleaned.length === 0) {
      return {
        valid: false,
        reason: 'Sender ID não pode estar vazio',
        suggestions: ['SMSAO', 'EMPRESA', 'LOJA']
      };
    }
    
    if (cleaned.length > 11) {
      return {
        valid: false,
        reason: 'Sender ID não pode ter mais de 11 caracteres',
        suggestions: [cleaned.substring(0, 11)]
      };
    }
    
    // Verifica caracteres permitidos (alfanuméricos)
    if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
      return {
        valid: false,
        reason: 'Sender ID deve conter apenas letras e números',
        suggestions: [cleaned.replace(/[^a-zA-Z0-9]/g, '')]
      };
    }
    
    // Não pode ser apenas números (pode ser confundido com número de telefone)
    if (/^\d+$/.test(cleaned)) {
      return {
        valid: false,
        reason: 'Sender ID não pode ser apenas números',
        suggestions: [`SMS${cleaned}`, `${cleaned}SMS`]
      };
    }
    
    // Verifica palavras proibidas/reservadas
    const forbidden = ['SMS', 'TEST', 'SPAM', 'ADMIN', 'SYSTEM'];
    const upperCleaned = cleaned.toUpperCase();
    
    if (forbidden.some(word => upperCleaned.includes(word))) {
      return {
        valid: false,
        reason: 'Sender ID contém palavra reservada',
        suggestions: [`MY${cleaned}`, `${cleaned}AO`]
      };
    }
    
    return { valid: true };
  }

  /**
   * Sugere melhorias para um Sender ID
   */
  static suggest(companyName: string): string[] {
    const cleaned = companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suggestions: string[] = [];
    
    // Sugestão básica
    if (cleaned.length <= 11) {
      suggestions.push(cleaned);
    } else {
      suggestions.push(cleaned.substring(0, 11));
    }
    
    // Sugestões com sufixo
    const suffixes = ['AO', 'SMS', 'INFO'];
    suffixes.forEach(suffix => {
      const withSuffix = cleaned.substring(0, 11 - suffix.length) + suffix;
      if (withSuffix.length <= 11) {
        suggestions.push(withSuffix);
      }
    });
    
    // Remove duplicatas
    return [...new Set(suggestions)];
  }
}