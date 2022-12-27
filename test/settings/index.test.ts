import { describe, expect, test, vi } from 'vitest'
import { defaultOptions } from './../../src/runtime/settings'

describe('Default options', () => {
  test('Define an API prefix', () => {
    expect(defaultOptions.api?.prefix).toBeDefined()
  })

  test('Define a sane delay for cache tag invalidation.', () => {
    expect(
      defaultOptions.api?.cacheTagInvalidationDelay,
    ).toBeGreaterThanOrEqual(60000)
  })

  test('Do not enable a cache.', () => {
    expect(defaultOptions.caches).toBeUndefined()
  })

  test('Do not define authorization.', () => {
    expect(defaultOptions.api?.authorization).toBeUndefined()
  })
})
