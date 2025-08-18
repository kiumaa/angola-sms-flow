/**
 * Utilities for SMS encoding detection, segment calculation, and template merging
 * For Angola (+244) SMS campaigns
 */

// GSM 7-bit character set
const GSM_7BIT_CHARS = `@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà`;

// Extended GSM characters (count as 2 chars each)
const GSM_EXTENDED_CHARS = `|^€{}[~]\\`;

export interface SMSSegmentInfo {
  encoding: 'GSM7' | 'UCS2';
  segments: number;
  perSegmentLimit: number;
  totalChars: number;
  isValid: boolean;
  reason?: string;
}

/**
 * Detect if text can be encoded in GSM 7-bit
 */
function isGSM7Compatible(text: string): boolean {
  for (const char of text) {
    if (!GSM_7BIT_CHARS.includes(char) && !GSM_EXTENDED_CHARS.includes(char)) {
      return false;
    }
  }
  return true;
}

/**
 * Count effective characters for GSM 7-bit (extended chars count as 2)
 */
function countGSM7Chars(text: string): number {
  let count = 0;
  for (const char of text) {
    if (GSM_EXTENDED_CHARS.includes(char)) {
      count += 2; // Extended chars count as 2
    } else {
      count += 1;
    }
  }
  return count;
}

/**
 * Calculate SMS segments based on encoding and content
 */
export function calculateSMSSegments(text: string, maxSegments: number = 6): SMSSegmentInfo {
  if (!text || text.length === 0) {
    return {
      encoding: 'GSM7',
      segments: 0,
      perSegmentLimit: 160,
      totalChars: 0,
      isValid: true
    };
  }

  const isGSM7 = isGSM7Compatible(text);
  const encoding = isGSM7 ? 'GSM7' : 'UCS2';
  
  let effectiveLength: number;
  let singleLimit: number;
  let concatLimit: number;

  if (encoding === 'GSM7') {
    effectiveLength = countGSM7Chars(text);
    singleLimit = 160;
    concatLimit = 153;
  } else {
    effectiveLength = text.length;
    singleLimit = 70;
    concatLimit = 67;
  }

  let segments: number;
  let perSegmentLimit: number;

  if (effectiveLength <= singleLimit) {
    segments = 1;
    perSegmentLimit = singleLimit;
  } else {
    segments = Math.ceil(effectiveLength / concatLimit);
    perSegmentLimit = concatLimit;
  }

  const isValid = segments <= maxSegments;
  const reason = !isValid ? `Message exceeds maximum ${maxSegments} segments (current: ${segments})` : undefined;

  return {
    encoding,
    segments,
    perSegmentLimit,
    totalChars: effectiveLength,
    isValid,
    reason
  };
}

/**
 * Merge template placeholders with contact data
 */
export function mergeTemplate(template: string, contact: {
  name?: string;
  attributes?: Record<string, any>;
  [key: string]: any;
}): string {
  if (!template) return '';
  
  let merged = template;
  
  // Replace {{name}} with contact name or empty string
  merged = merged.replace(/\{\{name\}\}/g, contact.name || '');
  
  // Replace {{attributes.field}} with attribute values
  merged = merged.replace(/\{\{attributes\.([^}]+)\}\}/g, (match, field) => {
    return contact.attributes?.[field]?.toString() || '';
  });
  
  // Replace other contact fields like {{email}}, {{phone}}, etc.
  merged = merged.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
    // Skip already processed attributes
    if (field.startsWith('attributes.')) return match;
    return contact[field]?.toString() || '';
  });
  
  return merged;
}

/**
 * Validate Angola phone number format (+2449XXXXXXXX)
 */
export function validateAngolaPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Must be exactly +244 followed by 9 digits
  const pattern = /^\+2449\d{8}$/;
  return pattern.test(phone);
}

/**
 * Deduplicate phone numbers from array
 */
export function deduplicatePhones(phones: string[]): string[] {
  return Array.from(new Set(phones.filter(validateAngolaPhone)));
}

/**
 * Calculate estimated credits for a campaign
 */
export function calculateCampaignCredits(
  messageTemplate: string,
  contacts: Array<{ name?: string; attributes?: Record<string, any>; [key: string]: any }>,
  maxSegments: number = 6
): {
  totalCredits: number;
  validTargets: number;
  invalidTargets: number;
  estimatedSegments: Record<string, number>; // encoding -> segment count
} {
  let totalCredits = 0;
  let validTargets = 0;
  let invalidTargets = 0;
  const estimatedSegments = { GSM7: 0, UCS2: 0 };

  for (const contact of contacts) {
    const merged = mergeTemplate(messageTemplate, contact);
    const segmentInfo = calculateSMSSegments(merged, maxSegments);
    
    if (segmentInfo.isValid) {
      totalCredits += segmentInfo.segments;
      validTargets++;
      estimatedSegments[segmentInfo.encoding] += segmentInfo.segments;
    } else {
      invalidTargets++;
    }
  }

  return {
    totalCredits,
    validTargets,
    invalidTargets,
    estimatedSegments
  };
}

/**
 * Generate preview of merged messages for UI
 */
export function generateMessagePreviews(
  template: string,
  contacts: Array<{ name?: string; attributes?: Record<string, any>; [key: string]: any }>,
  maxPreviews: number = 3
): Array<{
  contact: any;
  merged: string;
  segmentInfo: SMSSegmentInfo;
}> {
  return contacts.slice(0, maxPreviews).map(contact => ({
    contact,
    merged: mergeTemplate(template, contact),
    segmentInfo: calculateSMSSegments(mergeTemplate(template, contact))
  }));
}