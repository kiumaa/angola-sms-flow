
/**
 * Validates Angolan phone numbers
 * Accepts formats: +244XXXXXXXXX, 244XXXXXXXXX, 9XXXXXXXX, 244 9XX XXX XXX
 */
export const validateAngolanPhone = (phone: string): boolean => {
  // Remove all spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Patterns for Angolan phone numbers
  const patterns = [
    /^\+244[9][0-9]{8}$/, // +244XXXXXXXXX
    /^244[9][0-9]{8}$/, // 244XXXXXXXXX  
    /^[9][0-9]{8}$/, // 9XXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Validates international phone numbers (for testing purposes)
 * Accepts any format with country code
 */
export const validateInternationalPhone = (phone: string): boolean => {
  // Remove all spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic international phone validation
  // Must start with + and have at least 7 digits
  const internationalPattern = /^\+[1-9][0-9]{6,14}$/;
  
  return internationalPattern.test(cleanPhone);
};

/**
 * Normalizes Angolan phone number to international format
 */
export const normalizeAngolanPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // If already international format
  if (cleanPhone.startsWith('+244')) {
    return cleanPhone;
  }
  
  // If starts with 244
  if (cleanPhone.startsWith('244')) {
    return '+' + cleanPhone;
  }
  
  // If starts with 9 (local format)
  if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
    return '+244' + cleanPhone;
  }
  
  return phone; // Return original if can't normalize
};

/**
 * Normalizes international phone numbers (for testing)
 * Ensures proper international format with +
 */
export const normalizeInternationalPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // If already starts with +, return as is
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // If doesn't start with +, add it
  return '+' + cleanPhone;
};

/**
 * Sanitizes input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};
