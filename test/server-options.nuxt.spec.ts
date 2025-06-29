import { describe, it, expect } from 'vitest'
import { defineMultiCacheOptions } from '~/src/server-options'

const testOptions = {
  component: {
    bubbleError: true,
  },
}

describe('defineMultiCacheOptions', () => {
  it('should always return a function', () => {
    const resultFromObject = defineMultiCacheOptions(testOptions)
    const resultFromFunction = defineMultiCacheOptions(() => testOptions)

    expect(typeof resultFromObject).toBe('function')
    expect(typeof resultFromFunction).toBe('function')
  })

  it('should handle function input correctly', () => {
    const optionsFunction = () => testOptions
    const result = defineMultiCacheOptions(optionsFunction)

    expect(typeof result).toBe('function')
    // The result should be callable
    expect(() => result()).not.toThrow()
  })

  it('should handle object input correctly', () => {
    const result = defineMultiCacheOptions(testOptions)

    expect(typeof result).toBe('function')
    // The result should be callable
    expect(() => result()).not.toThrow()
  })

  it('should return consistent results when called multiple times', () => {
    const result = defineMultiCacheOptions(testOptions)
    const firstCall = result()
    const secondCall = result()

    expect(firstCall).toEqual(secondCall)
  })
})
