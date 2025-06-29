import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseMaxAge, type MaxAge } from '~/src/runtime/helpers/maxAge'

describe('parseMaxAge', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('with numeric inputs', () => {
    it('should return the number directly for positive integers', () => {
      expect(parseMaxAge(100)).toBe(100)
      expect(parseMaxAge(3600)).toBe(3600)
      expect(parseMaxAge(86400)).toBe(86400)
    })

    it('should return the number directly for zero', () => {
      expect(parseMaxAge(0)).toBe(0)
    })

    it('should return the number directly for negative numbers', () => {
      expect(parseMaxAge(-1)).toBe(-1)
      expect(parseMaxAge(-100)).toBe(-1)
    })

    it('should return a rounded number for floating point numbers', () => {
      expect(parseMaxAge(3.14)).toBe(3)
      expect(parseMaxAge(100.5)).toBe(101)
    })
  })

  describe('using the permanent keyword', () => {
    it('should return -1 for "permanent"', () => {
      expect(parseMaxAge('permanent')).toBe(-1)
    })
  })

  describe('using a named duration string', () => {
    it('should return correct durations for minute-based values', () => {
      expect(parseMaxAge('5m')).toBe(5 * 60)
      expect(parseMaxAge('10m')).toBe(10 * 60)
      expect(parseMaxAge('15m')).toBe(15 * 60)
      expect(parseMaxAge('30m')).toBe(30 * 60)
    })

    it('should return correct durations for hour-based values', () => {
      expect(parseMaxAge('1h')).toBe(60 * 60)
      expect(parseMaxAge('2h')).toBe(60 * 60 * 2)
      expect(parseMaxAge('4h')).toBe(60 * 60 * 4)
      expect(parseMaxAge('6h')).toBe(60 * 60 * 6)
      expect(parseMaxAge('12h')).toBe(60 * 60 * 12)
    })

    it('should return correct durations for day-based values', () => {
      expect(parseMaxAge('1d')).toBe(60 * 60 * 24)
      expect(parseMaxAge('2d')).toBe(60 * 60 * 24 * 2)
      expect(parseMaxAge('7d')).toBe(60 * 60 * 24 * 7)
    })
  })

  describe('using the named interval', () => {
    describe('next-hour', () => {
      it('should calculate correct seconds until next hour from middle of hour', () => {
        // Mock time: 2024-01-15 14:30:00 (30 minutes past the hour)
        const mockDate = new Date('2024-01-15T14:30:00.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('next-hour')
        // Should be 30 minutes = 1800 seconds until 15:00:00
        expect(result).toBe(30 * 60)
      })

      it('should calculate correct seconds until next hour from start of hour', () => {
        // Mock time: 2024-01-15 14:00:00 (exactly at the hour)
        const mockDate = new Date('2024-01-15T14:00:00.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('next-hour')
        // Should be 1 hour = 3600 seconds until 15:00:00
        expect(result).toBe(60 * 60)
      })

      it('should calculate correct seconds until next hour from end of hour', () => {
        // Mock time: 2024-01-15 14:59:30 (30 seconds before next hour)
        const mockDate = new Date('2024-01-15T14:59:30.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('next-hour')
        // Should be 30 seconds until 15:00:00
        expect(result).toBe(30)
      })

      it('should handle milliseconds correctly', () => {
        // Mock time: 2024-01-15 14:59:59.500 (500ms before next hour)
        const mockDate = new Date('2024-01-15T14:59:59.500Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('next-hour')
        // Should be 1 second (rounded up from 0.5 seconds)
        expect(result).toBe(1)
      })
    })

    describe('midnight', () => {
      it('should calculate correct seconds until midnight from middle of day', () => {
        // Mock time: 2024-01-15 12:00:00 (noon)
        const mockDate = new Date('2024-01-15T12:00:00.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('midnight')
        // Should be 12 hours = 43200 seconds until midnight of next day
        expect(result).toBe(12 * 60 * 60)
      })

      it('should calculate correct seconds until midnight from start of day', () => {
        // Mock time: 2024-01-15 00:00:00 (exactly midnight)
        const mockDate = new Date('2024-01-15T00:00:00.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('midnight')
        // Should be 24 hours = 86400 seconds until next midnight
        expect(result).toBe(24 * 60 * 60)
      })

      it('should calculate correct seconds until midnight from end of day', () => {
        // Mock time: 2024-01-15 23:59:30 (30 seconds before midnight)
        const mockDate = new Date('2024-01-15T23:59:30.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('midnight')
        // Should be 30 seconds until midnight
        expect(result).toBe(30)
      })

      it('should handle leap year correctly', () => {
        // Mock time: 2024-02-28 23:59:59 (leap year, day before leap day)
        const mockDate = new Date('2024-02-28T23:59:59.000Z')
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('midnight')
        // Should be 1 second until midnight (Feb 29th in leap year)
        expect(result).toBe(1)
      })
    })

    describe('end-of-week', () => {
      it('should calculate correct seconds until end of week from Monday', () => {
        // Mock time: 2024-01-15 12:00:00 (Monday, assuming Sunday is end of week)
        const mockDate = new Date('2024-01-15T12:00:00.000Z') // Monday
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('end-of-week')
        // From Monday 12:00 to Sunday 23:59:59.999
        // 6 days and 11 hours 59 minutes 59.999 seconds
        const expectedSeconds = 6 * 24 * 60 * 60 + 11 * 60 * 60 + 59 * 60 + 60
        expect(result).toBe(expectedSeconds)
      })

      it('should calculate correct seconds until end of week from Sunday', () => {
        // Mock time: 2024-01-14 12:00:00 (Sunday, middle of day)
        const mockDate = new Date('2024-01-14T12:00:00.000Z') // Sunday
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('end-of-week')
        // From Sunday 12:00 to Sunday 23:59:59.999 (same day)
        // 11 hours 59 minutes 59.999 seconds
        const expectedSeconds = 11 * 60 * 60 + 59 * 60 + 60
        expect(result).toBe(expectedSeconds)
      })

      it('should calculate correct seconds until end of week from Saturday', () => {
        // Mock time: 2024-01-13 18:00:00 (Saturday evening)
        const mockDate = new Date('2024-01-13T18:00:00.000Z') // Saturday
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('end-of-week')
        // From Saturday 18:00 to Sunday 23:59:59.999
        // 1 day 5 hours 59 minutes 59.999 seconds
        const expectedSeconds = 24 * 60 * 60 + 5 * 60 * 60 + 59 * 60 + 60
        expect(result).toBe(expectedSeconds)
      })

      it('should handle end of Sunday correctly', () => {
        // Mock time: 2024-01-14 23:59:59 (Sunday, almost end of week)
        const mockDate = new Date('2024-01-14T23:59:59.000Z') // Sunday
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('end-of-week')
        // Should be 1 second until end of week
        expect(result).toBe(1)
      })

      it('should handle beginning of Sunday correctly', () => {
        // Mock time: 2024-01-14 00:00:00 (Sunday, start of the last day)
        const mockDate = new Date('2024-01-14T00:00:00.000Z') // Sunday
        vi.setSystemTime(mockDate)

        const result = parseMaxAge('end-of-week')
        // Should be almost 24 hours until end of week
        const expectedSeconds = 23 * 60 * 60 + 59 * 60 + 60
        expect(result).toBe(expectedSeconds)
      })
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('should handle time calculations consistently across time zones', () => {
      // Test multiple times to ensure consistency.
      const times = [
        '2024-01-15T00:00:00.000Z',
        '2024-01-15T12:00:00.000Z',
        '2024-01-15T23:59:59.999Z',
      ]

      times.forEach((timeString) => {
        const mockDate = new Date(timeString)
        vi.setSystemTime(mockDate)

        // These should not throw errors and should return reasonable values.
        expect(() => parseMaxAge('next-hour')).not.toThrow()
        expect(() => parseMaxAge('midnight')).not.toThrow()
        expect(() => parseMaxAge('end-of-week')).not.toThrow()

        // Results should be positive
        expect(parseMaxAge('next-hour')).toBeGreaterThan(0)
        expect(parseMaxAge('midnight')).toBeGreaterThan(0)
        expect(parseMaxAge('end-of-week')).toBeGreaterThan(0)
      })
    })

    it('should handle year boundary correctly', () => {
      // Mock time: 2024-12-31 23:59:59 (New Year's Eve).
      const mockDate = new Date('2024-12-31T23:59:59.000Z')
      vi.setSystemTime(mockDate)

      expect(() => parseMaxAge('midnight')).not.toThrow()
      expect(parseMaxAge('midnight')).toBe(1) // 1 second until New Year
    })

    it('should handle month boundary correctly', () => {
      // Mock time: 2024-01-31 23:59:59 (end of January)
      const mockDate = new Date('2024-01-31T23:59:59.000Z')
      vi.setSystemTime(mockDate)

      expect(() => parseMaxAge('midnight')).not.toThrow()
      expect(parseMaxAge('midnight')).toBe(1) // 1 second until February
    })

    it('should always return integers for time-based calculations', () => {
      // Test with various fractional millisecond times
      const fractionalTimes = [
        '2024-01-15T14:30:30.100Z',
        '2024-01-15T14:30:30.500Z',
        '2024-01-15T14:30:30.900Z',
      ]

      fractionalTimes.forEach((timeString) => {
        const mockDate = new Date(timeString)
        vi.setSystemTime(mockDate)

        expect(Number.isInteger(parseMaxAge('next-hour'))).toBe(true)
        expect(Number.isInteger(parseMaxAge('midnight'))).toBe(true)
        expect(Number.isInteger(parseMaxAge('end-of-week'))).toBe(true)
      })
    })
  })

  describe('type safety and input validation', () => {
    it('should handle all valid MaxAge union types', () => {
      // Test that all possible MaxAge values are handled without runtime errors
      const validInputs: MaxAge[] = [
        // Numbers
        0,
        1,
        100,
        -1,
        // Permanent
        'permanent',
        // Named expires
        '5m',
        '10m',
        '15m',
        '30m',
        '1h',
        '2h',
        '4h',
        '6h',
        '12h',
        '1d',
        '2d',
        '7d',
        // Named intervals
        'next-hour',
        'midnight',
        'end-of-week',
      ]

      validInputs.forEach((input) => {
        expect(() => parseMaxAge(input)).not.toThrow()
        expect(typeof parseMaxAge(input)).toBe('number')
      })
    })

    it('should return consistent results for repeated calls with time intervals', () => {
      // Mock a specific time
      const mockDate = new Date('2024-01-15T14:30:00.000Z')
      vi.setSystemTime(mockDate)

      // Multiple calls should return the same result when time is mocked
      const result1 = parseMaxAge('next-hour')
      const result2 = parseMaxAge('next-hour')
      const result3 = parseMaxAge('next-hour')

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })
  })
})
