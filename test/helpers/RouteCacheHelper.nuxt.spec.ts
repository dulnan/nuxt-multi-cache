import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheRouteCacheHelper } from './../../src/runtime/helpers/RouteCacheHelper'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const mockDateTimestamp = toTimestamp(mockDate)

describe('The RouteCacheHelper', () => {
  test('can be instanciated correctly', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
    expect(helper).toBeInstanceOf(NuxtMultiCacheRouteCacheHelper)

    expect(helper.tags, 'Defaults to empty array.').toEqual([])
    expect(helper.cacheable, 'Defaults to no choice.').toEqual(null)
    expect(helper.maxAge, 'Defaults to permanent.').toEqual(-1)
  })

  test('Returns self in every method.', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)

    // Make sure this test fails if new methods are added, so that this test
    // will fail.
    const methods = Object.getOwnPropertyNames(
      NuxtMultiCacheRouteCacheHelper.prototype,
    )

    expect(methods).toMatchInlineSnapshot(`
      [
        "constructor",
        "allowStaleWhileRevalidate",
      ]
    `)

    // Test all methods to return self.
    expect(helper.addTags()).toEqual(helper)
    expect(helper.setCacheable()).toEqual(helper)
    expect(helper.setUncacheable()).toEqual(helper)
    expect(helper.setMaxAge(0)).toEqual(helper)
    expect(helper.setStaleIfError(0)).toEqual(helper)
  })

  test('adds cache tags', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
    helper.addTags(['one'])
    expect(helper.tags).toEqual(['one'])
    helper.addTags(['two'])
    expect(helper.tags).toEqual(['one', 'two'])
  })

  test('sets the cacheable value correctly', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
    expect(helper.cacheable).toEqual(null)
    helper.setCacheable()
    expect(helper.cacheable).toEqual(true)
    helper.setUncacheable()
    expect(helper.cacheable).toEqual(false)
  })

  test('Does not set to cacheable if it was set before', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
    expect(helper.cacheable).toEqual(null)
    helper.setUncacheable()
    expect(helper.cacheable).toEqual(false)
    helper.setCacheable()
    expect(helper.cacheable).toEqual(false)
  })

  test('sets the max age correctly', () => {
    const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
    expect(helper.maxAge, 'Defaults to permanent.').toEqual(-1)
    helper.setMaxAge(8000)
    expect(
      helper.maxAge,
      'Allows setting initial max age value even if technically larger than -1.',
    ).toEqual(8000)
    helper.setMaxAge(5000)
    expect(helper.maxAge, 'Sets a lower max age value.').toEqual(5000)
    helper.setMaxAge(999999999)
    expect(helper.maxAge, 'Does not set a larger max age value.').toEqual(5000)
  })
})
