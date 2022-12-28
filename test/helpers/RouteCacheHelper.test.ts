import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheRouteCacheHelper } from './../../src/runtime/helpers/RouteCacheHelper'

describe('The RouteCacheHelper', () => {
  test('can be instanciated correctly', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper()
    expect(helper).toBeInstanceOf(NuxtMultiCacheRouteCacheHelper)

    expect(helper.tags).toEqual([])
    expect(helper.cacheable).toEqual(null)
    expect(helper.maxAge).toEqual(null)
  })

  test('Returns self in every method.', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper()

    // Make sure this test fails if new methods are added, so that this test
    // will fail.
    const methods = Object.getOwnPropertyNames(
      NuxtMultiCacheRouteCacheHelper.prototype,
    )

    expect(methods).toMatchInlineSnapshot(`
      [
        "constructor",
        "addTags",
        "setCacheable",
        "setUncacheable",
        "setMaxAge",
      ]
    `)

    // Test all methods to return self.
    expect(helper.addTags()).toEqual(helper)
    expect(helper.setCacheable()).toEqual(helper)
    expect(helper.setUncacheable()).toEqual(helper)
    expect(helper.setMaxAge()).toEqual(helper)
  })

  test('adds cache tags', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper()
    helper.addTags(['one'])
    expect(helper.tags).toEqual(['one'])
    helper.addTags(['two'])
    expect(helper.tags).toEqual(['one', 'two'])
  })

  test('sets the cacheable value correctly', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper()
    expect(helper.cacheable).toEqual(null)
    helper.setCacheable()
    expect(helper.cacheable).toEqual(true)
    helper.setUncacheable()
    expect(helper.cacheable).toEqual(false)
  })

  test('Does not set to cacheable if it was set before', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper()
    expect(helper.cacheable).toEqual(null)
    helper.setUncacheable()
    expect(helper.cacheable).toEqual(false)
    helper.setCacheable()
    expect(helper.cacheable).toEqual(false)
  })

  test('sets the max age correctly', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper()
    expect(helper.maxAge).toEqual(null)
    helper.setMaxAge(8000)
    expect(helper.maxAge).toEqual(8000)
    helper.setMaxAge(5000)
    expect(helper.maxAge).toEqual(5000)
    helper.setMaxAge(999999999)
    expect(helper.maxAge).toEqual(5000)
  })
})
