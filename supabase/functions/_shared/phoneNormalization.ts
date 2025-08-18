// Phone normalization utility for Angola
export interface PhoneNormalizationResult {
  ok: boolean
  e164?: string
  reason?: string
}

export function normalizePhoneAngola(input: string): PhoneNormalizationResult {
  if (!input || typeof input !== 'string') {
    return { ok: false, reason: 'Invalid input' }
  }

  // Clean input - remove all non-numeric characters
  const cleaned = input.replace(/\D/g, '')
  
  if (cleaned.length === 0) {
    return { ok: false, reason: 'No digits found' }
  }

  // Angola patterns:
  // - 9XXXXXXXX (9 digits, starts with 9)
  // - 2449XXXXXXXX (12 digits, country code + 9XXXXXXXX)
  // - +2449XXXXXXXX (E.164 format)

  let phoneNumber = cleaned

  // Remove leading 244 if present
  if (phoneNumber.startsWith('244') && phoneNumber.length === 12) {
    phoneNumber = phoneNumber.substring(3)
  }

  // Validate 9-digit Angola format
  if (phoneNumber.length !== 9) {
    return { ok: false, reason: 'Must be 9 digits' }
  }

  if (!phoneNumber.startsWith('9')) {
    return { ok: false, reason: 'Must start with 9' }
  }

  // Valid Angola mobile number
  return {
    ok: true,
    e164: `+244${phoneNumber}`
  }
}

export function isValidAngolaE164(phone: string): boolean {
  if (!phone || !phone.startsWith('+244')) return false
  
  const digits = phone.substring(4)
  return digits.length === 9 && digits.startsWith('9')
}

export function formatPhoneForDisplay(e164: string): string {
  if (e164.startsWith('+244')) {
    return e164.substring(4)
  }
  return e164
}