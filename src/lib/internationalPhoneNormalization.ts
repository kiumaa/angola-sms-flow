// International phone normalization and validation
// Support for multiple countries with smart detection

export interface PhoneCountry {
  code: string;
  name: string;
  countryCode: string;
  flag: string;
  phoneLength: number[];
  mobileStarts: string[];
  format: string;
  example: string;
}

export interface PhoneNormalizationResult {
  ok: boolean;
  e164?: string;
  country?: PhoneCountry;
  reason?: string;
  detectedCountry?: PhoneCountry;
}

// Supported countries configuration
export const SUPPORTED_COUNTRIES: PhoneCountry[] = [
  {
    code: 'AO',
    name: 'Angola',
    countryCode: '+244',
    flag: '🇦🇴',
    phoneLength: [9],
    mobileStarts: ['9'],
    format: 'XXX XXX XXX',
    example: '912 345 678'
  },
  {
    code: 'MZ',
    name: 'Moçambique',
    countryCode: '+258',
    flag: '🇲🇿',
    phoneLength: [8, 9],
    mobileStarts: ['8', '9'],
    format: 'XX XXX XXXX',
    example: '84 123 4567'
  },
  {
    code: 'PT',
    name: 'Portugal',
    countryCode: '+351',
    flag: '🇵🇹',
    phoneLength: [9],
    mobileStarts: ['9'],
    format: 'XXX XXX XXX',
    example: '912 345 678'
  },
  {
    code: 'BR',
    name: 'Brasil',
    countryCode: '+55',
    flag: '🇧🇷',
    phoneLength: [10, 11],
    mobileStarts: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'],
    format: '(XX) XXXXX-XXXX',
    example: '(11) 91234-5678'
  },
  {
    code: 'CV',
    name: 'Cabo Verde',
    countryCode: '+238',
    flag: '🇨🇻',
    phoneLength: [7],
    mobileStarts: ['9'],
    format: 'XXX XX XX',
    example: '991 23 45'
  },
  {
    code: 'ST',
    name: 'São Tomé e Príncipe',
    countryCode: '+239',
    flag: '🇸🇹',
    phoneLength: [7],
    mobileStarts: ['9'],
    format: 'XXX XXXX',
    example: '991 2345'
  }
];

// Default country (Angola)
export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0];

/**
 * Detect country from phone number
 */
export function detectCountryFromPhone(input: string): PhoneCountry | null {
  const digitsOnly = input.replace(/\D/g, '');
  
  // Check for country codes
  for (const country of SUPPORTED_COUNTRIES) {
    const countryDigits = country.countryCode.replace('+', '');
    
    if (digitsOnly.startsWith(countryDigits)) {
      return country;
    }
    
    // Check for international format with 00
    if (digitsOnly.startsWith('00' + countryDigits)) {
      return country;
    }
  }
  
  return null;
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): PhoneCountry | null {
  return SUPPORTED_COUNTRIES.find(c => c.code === code) || null;
}

/**
 * Normalize international phone number
 */
export function normalizeInternationalPhone(
  input: string, 
  selectedCountry?: PhoneCountry
): PhoneNormalizationResult {
  if (!input) {
    return { ok: false, reason: 'empty_input' };
  }

  const digitsOnly = input.replace(/\D/g, '');
  
  // Try to detect country from input
  const detectedCountry = detectCountryFromPhone(input);
  const targetCountry = selectedCountry || detectedCountry || DEFAULT_COUNTRY;
  
  let normalized: string;
  let localNumber: string;

  // Handle different input formats
  const countryDigits = targetCountry.countryCode.replace('+', '');
  
  if (digitsOnly.startsWith(countryDigits)) {
    // Already has country code: 2449XXXXXXXX
    localNumber = digitsOnly.substring(countryDigits.length);
    normalized = `+${digitsOnly}`;
  } else if (digitsOnly.startsWith('00' + countryDigits)) {
    // International format with 00 prefix: 002449XXXXXXXX
    localNumber = digitsOnly.substring(countryDigits.length + 2);
    normalized = `+${digitsOnly.substring(2)}`;
  } else {
    // Local format
    localNumber = digitsOnly;
    normalized = `${targetCountry.countryCode}${localNumber}`;
  }

  // Validate local number format
  const isValidLength = targetCountry.phoneLength.includes(localNumber.length);
  
  let isValidMobile = false;
  if (targetCountry.code === 'BR') {
    // Special handling for Brazil area codes
    isValidMobile = localNumber.length >= 10 && 
      targetCountry.mobileStarts.some(prefix => localNumber.startsWith(prefix));
  } else {
    // Standard mobile prefix validation
    isValidMobile = targetCountry.mobileStarts.some(prefix => localNumber.startsWith(prefix));
  }

  if (!isValidLength) {
    return { 
      ok: false, 
      reason: `invalid_length_${targetCountry.code}`,
      country: targetCountry,
      detectedCountry
    };
  }

  if (!isValidMobile) {
    return { 
      ok: false, 
      reason: `invalid_mobile_prefix_${targetCountry.code}`,
      country: targetCountry,
      detectedCountry
    };
  }

  return { 
    ok: true, 
    e164: normalized,
    country: targetCountry,
    detectedCountry
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(e164: string, country?: PhoneCountry): string {
  if (!e164) return '';
  
  const targetCountry = country || detectCountryFromPhone(e164) || DEFAULT_COUNTRY;
  const countryDigits = targetCountry.countryCode.replace('+', '');
  
  if (e164.startsWith(targetCountry.countryCode)) {
    const localNumber = e164.substring(targetCountry.countryCode.length);
    
    // Apply country-specific formatting
    switch (targetCountry.code) {
      case 'AO': // Angola: XXX XXX XXX
      case 'PT': // Portugal: XXX XXX XXX
        if (localNumber.length === 9) {
          return `${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`;
        }
        break;
        
      case 'MZ': // Mozambique: XX XXX XXXX
        if (localNumber.length >= 8) {
          return `${localNumber.slice(0, 2)} ${localNumber.slice(2, 5)} ${localNumber.slice(5)}`;
        }
        break;
        
      case 'BR': // Brazil: (XX) XXXXX-XXXX
        if (localNumber.length >= 10) {
          const areaCode = localNumber.slice(0, 2);
          const firstPart = localNumber.slice(2, -4);
          const lastPart = localNumber.slice(-4);
          return `(${areaCode}) ${firstPart}-${lastPart}`;
        }
        break;
        
      case 'CV': // Cape Verde: XXX XX XX
        if (localNumber.length === 7) {
          return `${localNumber.slice(0, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5)}`;
        }
        break;
        
      case 'ST': // São Tomé: XXX XXXX
        if (localNumber.length === 7) {
          return `${localNumber.slice(0, 3)} ${localNumber.slice(3)}`;
        }
        break;
    }
  }
  
  return e164;
}

/**
 * Batch normalize phone numbers
 */
export function batchNormalizeInternationalPhones(
  phones: string[],
  defaultCountry?: PhoneCountry
): Array<{
  index: number;
  original: string;
  result: PhoneNormalizationResult;
}> {
  return phones.map((phone, index) => ({
    index,
    original: phone,
    result: normalizeInternationalPhone(phone, defaultCountry)
  }));
}

/**
 * Validate and normalize phone numbers with international support
 */
export function validateAndNormalizeInternationalPhones(
  phones: string[],
  defaultCountry?: PhoneCountry
): {
  valid: string[];
  invalid: { phone: string; error: string; country?: PhoneCountry }[];
  duplicates: number;
  countryStats: Record<string, number>;
} {
  const validSet = new Set<string>();
  const invalid: { phone: string; error: string; country?: PhoneCountry }[] = [];
  const countryStats: Record<string, number> = {};
  let duplicates = 0;

  for (const phone of phones) {
    const result = normalizeInternationalPhone(phone, defaultCountry);
    
    if (result.ok && result.e164) {
      if (validSet.has(result.e164)) {
        duplicates++;
      } else {
        validSet.add(result.e164);
        
        // Track country statistics
        const countryCode = result.country?.code || 'unknown';
        countryStats[countryCode] = (countryStats[countryCode] || 0) + 1;
      }
    } else {
      invalid.push({
        phone: phone,
        error: result.reason || 'Formato inválido',
        country: result.country
      });
    }
  }

  return {
    valid: Array.from(validSet),
    invalid,
    duplicates,
    countryStats
  };
}

/**
 * Parse bulk phone input with international support
 */
export function parseBulkInternationalPhoneInput(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Legacy compatibility functions for Angola
export const normalizePhoneAngola = (input: string) => 
  normalizeInternationalPhone(input, DEFAULT_COUNTRY);

export const isValidAngolaE164 = (phone: string): boolean => {
  const result = normalizeInternationalPhone(phone, DEFAULT_COUNTRY);
  return result.ok;
};

export const batchNormalizePhones = (phones: string[]) =>
  batchNormalizeInternationalPhones(phones, DEFAULT_COUNTRY);

export const validateAndNormalizePhones = (phones: string[]) =>
  validateAndNormalizeInternationalPhones(phones, DEFAULT_COUNTRY);

export const parseBulkPhoneInput = parseBulkInternationalPhoneInput;