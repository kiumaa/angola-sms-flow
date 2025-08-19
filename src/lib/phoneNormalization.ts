// Phone normalization for Angola (+244)

interface PhoneNormalizationResult {
  ok: boolean;
  e164?: string;
  reason?: string;
}

/**
 * Normalizes phone numbers to E.164 format for Angola
 * Accepts various formats and converts to +2449XXXXXXXX
 */
export function normalizePhoneAngola(input: string): PhoneNormalizationResult {
  if (!input) {
    return { ok: false, reason: 'empty_input' };
  }

  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, '');

  // Handle different input formats
  let normalized: string;

  if (digitsOnly.startsWith('244')) {
    // Already has Angola country code
    if (digitsOnly.length === 12) {
      // 2449XXXXXXXX
      normalized = `+${digitsOnly}`;
    } else {
      return { ok: false, reason: 'invalid_length_with_country' };
    }
  } else if (digitsOnly.startsWith('00244')) {
    // International format with 00 prefix
    if (digitsOnly.length === 14) {
      // 002449XXXXXXXX
      normalized = `+${digitsOnly.substring(2)}`;
    } else {
      return { ok: false, reason: 'invalid_length_international' };
    }
  } else if (digitsOnly.length === 9 && digitsOnly.startsWith('9')) {
    // Local format: 9XXXXXXXX
    normalized = `+244${digitsOnly}`;
  } else {
    return { ok: false, reason: 'invalid_format' };
  }

  // Final validation: should be +244 + 9 digits (12 chars total)
  if (normalized.length !== 13 || !normalized.startsWith('+2449')) {
    return { ok: false, reason: 'final_validation_failed' };
  }

  return { ok: true, e164: normalized };
}

/**
 * Validates if a phone number is a valid Angola E.164 format
 */
export function isValidAngolaE164(phone: string): boolean {
  const result = normalizePhoneAngola(phone);
  return result.ok;
}

/**
 * Formats phone number for display (removes +244 prefix for local display)
 */
export function formatPhoneForDisplay(e164: string): string {
  if (e164.startsWith('+244')) {
    return e164.substring(4); // Remove +244 prefix
  }
  return e164;
}

/**
 * Batch normalize phone numbers, returning results with indices
 */
export function batchNormalizePhones(phones: string[]): Array<{
  index: number;
  original: string;
  result: PhoneNormalizationResult;
}> {
  return phones.map((phone, index) => ({
    index,
    original: phone,
    result: normalizePhoneAngola(phone)
  }));
}

/**
 * Parses bulk input text (supporting newlines, commas, and semicolons)
 */
export function parseBulkPhoneInput(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Validates and normalizes phone numbers, returning valid and invalid lists
 */
export function validateAndNormalizePhones(phones: string[]): {
  valid: string[];
  invalid: { phone: string; error: string }[];
  duplicates: number;
} {
  const validSet = new Set<string>();
  const invalid: { phone: string; error: string }[] = [];
  let duplicates = 0;

  for (const phone of phones) {
    const result = normalizePhoneAngola(phone);
    
    if (result.ok && result.e164) {
      if (validSet.has(result.e164)) {
        duplicates++;
      } else {
        validSet.add(result.e164);
      }
    } else {
      invalid.push({
        phone: phone,
        error: result.reason || 'Formato inválido'
      });
    }
  }

  return {
    valid: Array.from(validSet),
    invalid,
    duplicates
  };
}