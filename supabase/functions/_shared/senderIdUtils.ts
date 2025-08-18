// Sender ID utilities

const DEFAULT_SENDER_ID = 'SMSAO'
const DEPRECATED_SENDER_IDS = ['ONSMS', 'SMS']

export function resolveSenderId(input?: string | null): string {
  // If no input or empty, return default
  if (!input || input.trim().length === 0) {
    return DEFAULT_SENDER_ID
  }

  const trimmed = input.trim().toUpperCase()

  // If deprecated sender ID, replace with default
  if (DEPRECATED_SENDER_IDS.includes(trimmed)) {
    console.log(`Deprecated sender ID "${input}" replaced with "${DEFAULT_SENDER_ID}"`)
    return DEFAULT_SENDER_ID
  }

  // If invalid format, return default
  if (!isValidSenderIdFormat(trimmed)) {
    console.log(`Invalid sender ID format "${input}" replaced with "${DEFAULT_SENDER_ID}"`)
    return DEFAULT_SENDER_ID
  }

  return trimmed
}

export function isValidSenderIdFormat(senderId: string): boolean {
  // Must be alphanumeric and max 11 characters
  const alphanumericRegex = /^[A-Z0-9]+$/
  return alphanumericRegex.test(senderId) && senderId.length <= 11 && senderId.length > 0
}