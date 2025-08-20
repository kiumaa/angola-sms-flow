import { calculateSMSSegments } from '@/lib/smsUtils'

describe('SMS Utils', () => {
  describe('calculateSMSSegments', () => {
    it('calculates single segment for short GSM7 text', () => {
      const result = calculateSMSSegments('Hello World')
      expect(result).toEqual({
        charset: 'GSM7',
        segments: 1,
        maxLength: 160,
        isValid: true
      })
    })

    it('calculates multiple segments for long GSM7 text', () => {
      const longText = 'A'.repeat(200)
      const result = calculateSMSSegments(longText)
      expect(result).toEqual({
        charset: 'GSM7',
        segments: 2,
        maxLength: 153,
        isValid: true
      })
    })

    it('calculates single segment for short Unicode text', () => {
      const result = calculateSMSSegments('Hello 🌍')
      expect(result).toEqual({
        charset: 'UCS2',
        segments: 1,
        maxLength: 70,
        isValid: true
      })
    })

    it('handles empty string', () => {
      const result = calculateSMSSegments('')
      expect(result).toEqual({
        charset: 'GSM7',
        segments: 0,
        maxLength: 160,
        isValid: true
      })
    })

    it('marks as invalid when exceeding max segments', () => {
      const veryLongText = 'A'.repeat(1000)
      const result = calculateSMSSegments(veryLongText, 3)
      expect(result.isValid).toBe(false)
      expect(result.segments).toBeGreaterThan(3)
    })
  })
})