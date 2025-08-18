// SMS utilities for segment calculation and template merging

export interface SMSSegmentInfo {
  encoding: 'GSM7' | 'UCS2'
  segments: number
  charactersUsed: number
  maxCharacters: number
  isValid: boolean
}

// GSM 7-bit standard characters
const GSM7_CHARS = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"

// GSM 7-bit extended characters (escaped)  
const GSM7_EXTENDED = "{}\\[~]|€"

export function isGSM7Compatible(text: string): boolean {
  for (const char of text) {
    if (!GSM7_CHARS.includes(char) && !GSM7_EXTENDED.includes(char)) {
      return false
    }
  }
  return true
}

export function countGSM7Chars(text: string): number {
  let count = 0
  for (const char of text) {
    if (GSM7_EXTENDED.includes(char)) {
      count += 2 // Extended characters count as 2
    } else {
      count += 1
    }
  }
  return count
}

export function calculateSMSSegments(text: string, maxSegments = 10): SMSSegmentInfo {
  const isGSM7 = isGSM7Compatible(text)
  
  if (isGSM7) {
    const charCount = countGSM7Chars(text)
    let segments: number
    let maxChars: number

    if (charCount <= 160) {
      segments = 1
      maxChars = 160
    } else {
      segments = Math.ceil(charCount / 153)
      maxChars = segments * 153
    }

    return {
      encoding: 'GSM7',
      segments: Math.min(segments, maxSegments),
      charactersUsed: charCount,
      maxCharacters: maxChars,
      isValid: segments <= maxSegments
    }
  } else {
    // UCS2 (Unicode) encoding
    const charCount = text.length
    let segments: number
    let maxChars: number

    if (charCount <= 70) {
      segments = 1
      maxChars = 70
    } else {
      segments = Math.ceil(charCount / 67)
      maxChars = segments * 67
    }

    return {
      encoding: 'UCS2',
      segments: Math.min(segments, maxSegments),
      charactersUsed: charCount,
      maxCharacters: maxChars,
      isValid: segments <= maxSegments
    }
  }
}