import { describe, expect, test } from 'vitest'
import { defaultOptions, DEFAULT_API_PREFIX } from './../../src/build/options'

describe('Default options', () => {
  test('Define an API prefix', () => {
    expect(defaultOptions.api?.prefix).toBeDefined()

    // Should start with two underscores.
    expect(DEFAULT_API_PREFIX).toMatch(/^\/__/)
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
