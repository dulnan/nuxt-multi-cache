import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CacheHelper } from '~/src/runtime/helpers/CacheHelper'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

// Mock Date for predictable time-based tests
const mockDate = new Date('2024-03-15T10:30:00.000Z')
const mockDateTimestamp = toTimestamp(mockDate)

describe('CacheHelper', () => {
  let cache: CacheHelper

  beforeEach(() => {
    cache = new CacheHelper(mockDateTimestamp)
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      expect(cache.tags).toEqual([])
      expect(cache.cacheable).toBe(null)
      expect(cache.maxAge, 'Defaults to permanent.').toBe(-1)
    })
  })

  describe('setMaxAge', () => {
    it('should set maxAge from null to a number', () => {
      cache.setMaxAge(300)
      expect(cache.maxAge).toBe(300)
    })

    it('should set maxAge to a lower value', () => {
      cache.setMaxAge(500)
      cache.setMaxAge(300)
      expect(cache.maxAge).toBe(300)
    })

    it('should not set maxAge to a higher value', () => {
      cache.setMaxAge(300)
      cache.setMaxAge(500)
      expect(cache.maxAge).toBe(300)
    })

    it('should handle permanent cache (-1)', () => {
      cache.setMaxAge(300)
      cache.setMaxAge('permanent')
      expect(cache.maxAge).toBe(-1)
    })

    it('should override permanent cache with any numeric value', () => {
      cache.setMaxAge('permanent')
      expect(cache.maxAge).toBe(-1)
      cache.setMaxAge(100)
      expect(cache.maxAge).toBe(100)
    })

    it('should handle named durations', () => {
      cache.setMaxAge('5m')
      expect(cache.maxAge).toBe(300) // 5 * 60

      cache.setMaxAge('1h')
      expect(cache.maxAge).toBe(300) // Should not update since 3600 > 300
    })

    it('should handle named intervals', () => {
      // next-hour: should calculate time until next hour boundary
      cache.setMaxAge('next-hour')
      // At 10:30, next hour is 11:00, so 30 minutes = 1800 seconds
      expect(cache.maxAge).toBe(1800)

      // midnight: should calculate time until next midnight
      const cache2 = new CacheHelper(mockDateTimestamp)
      cache2.setMaxAge('midnight')
      // From 10:30 to next midnight (24:00) = 13.5 hours = 48600 seconds
      expect(cache2.maxAge).toBe(48600)
    })

    it('should handle fractional numbers by rounding', () => {
      cache.setMaxAge(123.7)
      expect(cache.maxAge).toBe(123)

      cache.setMaxAge(123.3)
      expect(cache.maxAge).toBe(123) // Should update since rounded value is lower
    })

    it('should return this for method chaining', () => {
      const result = cache.setMaxAge(300)
      expect(result).toBe(cache)
    })
  })

  describe('setNumeric', () => {
    it('should work with maxAge property', () => {
      cache.setNumeric('maxAge', 600)
      expect(cache.maxAge).toBe(600)
    })

    it('should follow the same rules as setMaxAge', () => {
      cache.setNumeric('maxAge', 500)
      cache.setNumeric('maxAge', 300)
      expect(cache.maxAge).toBe(300)

      cache.setNumeric('maxAge', 700)
      expect(cache.maxAge).toBe(300) // Should not change
    })

    it('should handle permanent value (-1)', () => {
      cache.setNumeric('maxAge', 500)
      cache.setNumeric('maxAge', 'permanent')
      expect(cache.maxAge).toBe(-1)
    })

    it('should return this for method chaining', () => {
      const result = cache.setNumeric('maxAge', 300)
      expect(result).toBe(cache)
    })
  })

  describe('addTags', () => {
    it('should add a single string tag', () => {
      cache.addTags('user')
      expect(cache.tags).toEqual(['user'])
    })

    it('should add multiple tags from array', () => {
      cache.addTags(['user', 'profile'])
      expect(cache.tags).toEqual(['user', 'profile'])
    })

    it('should accumulate tags across multiple calls', () => {
      cache.addTags('user')
      cache.addTags(['profile', 'settings'])
      cache.addTags('admin')
      expect(cache.tags).toEqual(['user', 'profile', 'settings', 'admin'])
    })

    it('should handle empty array', () => {
      cache.addTags([])
      expect(cache.tags).toEqual([])
    })

    it('should handle default parameter (empty array)', () => {
      cache.addTags()
      expect(cache.tags).toEqual([])
    })

    it('should handle empty string', () => {
      cache.addTags('')
      expect(cache.tags).toEqual([''])
    })

    it('should return this for method chaining', () => {
      const result = cache.addTags('user')
      expect(result).toBe(cache)
    })

    it('should allow duplicate tags', () => {
      cache.addTags('user')
      cache.addTags('user')
      expect(cache.tags).toEqual(['user', 'user'])
    })
  })

  describe('setCacheable', () => {
    it('should set cacheable to true from null', () => {
      cache.setCacheable()
      expect(cache.cacheable).toBe(true)
    })

    it('should not change cacheable if already true', () => {
      cache.setCacheable()
      cache.setCacheable()
      expect(cache.cacheable).toBe(true)
    })

    it('should not change cacheable if already false', () => {
      cache.setUncacheable()
      cache.setCacheable()
      expect(cache.cacheable).toBe(false)
    })

    it('should return this for method chaining', () => {
      const result = cache.setCacheable()
      expect(result).toBe(cache)
    })
  })

  describe('setUncacheable', () => {
    it('should set cacheable to false from null', () => {
      cache.setUncacheable()
      expect(cache.cacheable).toBe(false)
    })

    it('should set cacheable to false from true', () => {
      cache.setCacheable()
      cache.setUncacheable()
      expect(cache.cacheable).toBe(false)
    })

    it('should keep cacheable as false', () => {
      cache.setUncacheable()
      cache.setUncacheable()
      expect(cache.cacheable).toBe(false)
    })

    it('should return this for method chaining', () => {
      const result = cache.setUncacheable()
      expect(result).toBe(cache)
    })
  })

  describe('isCacheable', () => {
    it('should return false for null cacheable', () => {
      expect(cache.isCacheable()).toBe(false)
    })

    it('should return true for true cacheable', () => {
      cache.setCacheable()
      expect(cache.isCacheable()).toBe(true)
    })

    it('should return false for false cacheable', () => {
      cache.setUncacheable()
      expect(cache.isCacheable()).toBe(false)
    })
  })

  describe('getExpires', () => {
    it('should return undefined for null maxAge', () => {
      expect(cache.getExpires('maxAge')).toEqual(-1)
    })

    it('should return undefined for permanent cache (-1)', () => {
      cache.setMaxAge('permanent')
      expect(cache.getExpires('maxAge')).toEqual(-1)
    })

    it('should calculate correct expiration timestamp', () => {
      cache.setMaxAge(300) // 5 minutes
      const currentTimestamp = toTimestamp(new Date())
      const expires = cache.getExpires('maxAge')

      expect(expires).toBe(currentTimestamp + 300)
    })

    it('should handle zero maxAge', () => {
      cache.maxAge = 0
      const expires = cache.getExpires('maxAge')

      expect(expires).toBe(0)
    })

    it('should floor the timestamp calculation', () => {
      cache.setMaxAge(100)

      // Move time slightly forward to test flooring
      vi.setSystemTime(new Date(mockDate.getTime() + 500)) // +500ms

      const currentTimestamp = toTimestamp(new Date())
      const expires = cache.getExpires('maxAge')

      expect(expires).toBe(currentTimestamp + 100)
    })
  })

  describe('method chaining', () => {
    it('should allow complete method chaining', () => {
      const result = cache
        .setMaxAge(300)
        .addTags(['user', 'profile'])
        .setCacheable()
        .addTags('admin')
        .setMaxAge(200) // Should update since it's lower

      expect(result).toBe(cache)
      expect(cache.maxAge).toBe(200)
      expect(cache.tags).toEqual(['user', 'profile', 'admin'])
      expect(cache.cacheable).toBe(true)
    })

    it('should handle mixed operations correctly', () => {
      cache
        .setCacheable()
        .setUncacheable() // Should override
        .setMaxAge(500)
        .addTags('test')
        .setMaxAge(1000) // Should not update
        .setCacheable() // Should not update since already false

      expect(cache.cacheable).toBe(false)
      expect(cache.maxAge).toBe(500)
      expect(cache.tags).toEqual(['test'])
    })
  })

  describe('edge cases and error conditions', () => {
    it('should handle very large numbers', () => {
      cache.setMaxAge(Number.MAX_SAFE_INTEGER)
      expect(cache.maxAge).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle zero values', () => {
      cache.setMaxAge(0)
      expect(cache.maxAge).toBe(0)
    })

    it('should handle negative numbers', () => {
      cache.setMaxAge(-100)
      expect(cache.maxAge).toBe(-1)

      // Setting permanent should still work since -1 < -100
      cache.setMaxAge('permanent')
      expect(cache.maxAge).toBe(-1)
    })

    it('should handle special numeric values', () => {
      cache.setMaxAge(Infinity)
      expect(cache.maxAge).toBe(Infinity)

      cache.setMaxAge(100)
      expect(cache.maxAge).toBe(100) // Should update since 100 < Infinity
    })

    it('should handle NaN by rounding to NaN', () => {
      cache.setMaxAge(NaN)
      expect(cache.maxAge).toBeNaN()
    })
  })

  describe('time-dependent intervals', () => {
    it('should calculate next-hour correctly at different times', () => {
      // Test at 10:30 - should be 30 minutes to next hour
      cache.setMaxAge('next-hour')
      expect(cache.maxAge).toBe(1800) // 30 minutes

      // Test at exactly the hour
      const date = new Date('2024-03-15T11:00:00.000Z')
      vi.setSystemTime(date)
      const cache2 = new CacheHelper(toTimestamp(date))
      cache2.setMaxAge('next-hour')
      expect(cache2.maxAge).toBe(3600) // Full hour
    })

    it('should calculate midnight correctly', () => {
      // At 10:30, next midnight is 13.5 hours away
      cache.setMaxAge('midnight')
      expect(cache.maxAge).toBe(48600) // 13.5 * 3600

      // Test near midnight
      const date = new Date('2024-03-15T23:59:00.000Z')
      vi.setSystemTime(date)
      const cache2 = new CacheHelper(toTimestamp(date))
      cache2.setMaxAge('midnight')
      expect(cache2.maxAge).toBe(60) // 1 minute to midnight
    })

    it('should calculate end-of-week correctly', () => {
      // March 15, 2024 is a Friday
      // End of week (Sunday 23:59:59) should be 2 days, 13 hours, 29 minutes, 59 seconds away
      cache.setMaxAge('end-of-week')
      const expectedSeconds = 2 * 24 * 3600 + 13 * 3600 + 29 * 60 + 59
      expect(cache.maxAge).toBe(expectedSeconds + 1) // +1 because of ceiling
    })
  })

  describe('complex scenarios', () => {
    it('should handle competing maxAge settings correctly', () => {
      cache.setMaxAge(1000)
      cache.setMaxAge('5m') // 300 seconds, should update
      expect(cache.maxAge).toBe(300)

      cache.setMaxAge('1h') // 3600 seconds, should not update
      expect(cache.maxAge).toBe(300)

      cache.setMaxAge('permanent') // -1, should update
      expect(cache.maxAge).toBe(-1)

      cache.setMaxAge(100) // Should update since any number overrides -1
      expect(cache.maxAge).toBe(100)
    })

    it('should maintain independent state for different instances', () => {
      const cache1 = new CacheHelper(mockDateTimestamp)
      const cache2 = new CacheHelper(mockDateTimestamp)

      cache1.setMaxAge(100).setCacheable().addTags('cache1')
      cache2.setMaxAge(200).setUncacheable().addTags('cache2')

      expect(cache1.maxAge).toBe(100)
      expect(cache1.cacheable).toBe(true)
      expect(cache1.tags).toEqual(['cache1'])

      expect(cache2.maxAge).toBe(200)
      expect(cache2.cacheable).toBe(false)
      expect(cache2.tags).toEqual(['cache2'])
    })
  })
})
