import { describe, expect, test } from 'vitest'
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
