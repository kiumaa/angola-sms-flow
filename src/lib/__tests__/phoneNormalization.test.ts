import { validateAndNormalizePhones, parseBulkPhoneInput } from '@/lib/phoneNormalization'

describe('Phone Normalization', () => {
  describe('parseBulkPhoneInput', () => {
    it('parses bulk input with different separators', () => {
      const input = '9123456789\n9234567890,9345678901;9456789012'
      const result = parseBulkPhoneInput(input)
      
      expect(result).toEqual([
        '9123456789',
        '9234567890', 
        '9345678901',
        '9456789012'
      ])
    })

    it('handles empty lines and extra whitespace', () => {
      const input = '  9123456789  \n\n  9234567890  \n  '
      const result = parseBulkPhoneInput(input)
      
      expect(result).toEqual(['9123456789', '9234567890'])
    })

    it('returns empty array for empty input', () => {
      expect(parseBulkPhoneInput('')).toEqual([])
      expect(parseBulkPhoneInput('   \n  \n  ')).toEqual([])
    })
  })

  describe('validateAndNormalizePhones', () => {
    it('separates valid and invalid numbers', () => {
      const phones = ['9123456789', 'invalid', '9234567890', '812345678']
      const result = validateAndNormalizePhones(phones)
      
      expect(result.valid).toEqual(['+2449123456789', '+2449234567890'])
      expect(result.invalid).toEqual(['invalid', '812345678'])
    })

    it('deduplicates valid numbers', () => {
      const phones = ['9123456789', '912 345 678 9', '+2449123456789']
      const result = validateAndNormalizePhones(phones)
      
      expect(result.valid).toEqual(['+2449123456789'])
      expect(result.invalid).toEqual(['912 345 678 9', '+2449123456789'])
    })

    it('handles empty input', () => {
      const result = validateAndNormalizePhones([])
      expect(result.valid).toEqual([])
      expect(result.invalid).toEqual([])
    })
  })
})