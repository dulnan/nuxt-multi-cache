import { describe, expect, test } from 'vitest'
import {
  defaultOptions,
  DEFAULT_API_PREFIX,
  DEFAULT_CACHE_TAG_INVALIDATION_DELAY,
} from './../../src/runtime/settings'

describe('Default options', () => {
  test('Define an API prefix', () => {
    expect(defaultOptions.api?.prefix).toBeDefined()

    // Should start with two underscores.
    expect(DEFAULT_API_PREFIX).toMatch(/^\/__/)
  })

  test('Define a delay for cache tag invalidation.', () => {
    expect(defaultOptions.api?.cacheTagInvalidationDelay).toBeDefined()

    // Should be more than 5 seconds.
    expect(DEFAULT_CACHE_TAG_INVALIDATION_DELAY).toBeGreaterThan(5000)

    // Should be less than or equal to 1 min.
    expect(DEFAULT_CACHE_TAG_INVALIDATION_DELAY).toBeLessThanOrEqual(60000)
  })

  test('All features are disabled by default.', () => {
    expect(defaultOptions.component).toBeUndefined()
    expect(defaultOptions.data).toBeUndefined()
    expect(defaultOptions.route).toBeUndefined()
    expect(defaultOptions.cdn).toBeUndefined()
  })

  test('Do not define authorization.', () => {
    expect(defaultOptions.api?.authorization).toBeUndefined()
  })
})
