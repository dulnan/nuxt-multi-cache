import { CacheControl } from '@tusbar/cache-control'
import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'

describe('The CDNHelper', () => {
  test('can be instanciated correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    expect(helper).toBeInstanceOf(NuxtMultiCacheCDNHelper)

    expect(helper._tags).toEqual([])
    expect(helper._control).toBeInstanceOf(CacheControl)
  })

  test('Returns self in every method.', () => {
    const helper = new NuxtMultiCacheCDNHelper()

    // Make sure this test fails if new methods are added, so that this test
    // will be updated.
    const methods = Object.getOwnPropertyNames(
      NuxtMultiCacheCDNHelper.prototype,
    )

    expect(methods).toMatchInlineSnapshot(`
      [
        "constructor",
        "set",
        "addTags",
        "setNumeric",
        "private",
        "public",
      ]
    `)

    // Test all methods to return self.
    expect(helper.set('maxAge', 9000)).toEqual(helper)
    expect(helper.addTags([])).toEqual(helper)
    expect(helper.setNumeric('maxAge', 9000)).toEqual(helper)
    expect(helper.private()).toEqual(helper)
    expect(helper.public()).toEqual(helper)
  })

  test('Sets cache control properties', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    helper.set('maxAge', 9999)
    helper.set('noTransform', true)
    expect(helper._control.maxAge).toEqual(9999)
    expect(helper._control.noTransform).toEqual(true)
  })

  test('adds cache tags', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    helper.addTags(['one'])
    expect(helper._tags).toEqual(['one'])

    helper.addTags(['two'])
    expect(helper._tags).toEqual(['one', 'two'])
  })

  test('sets numeric values', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    helper.setNumeric('maxAge', 9999)
    expect(helper._control.maxAge).toEqual(9999)
  })

  test('sets numeric values only if they are lower than the current value', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    helper.setNumeric('maxAge', 1000)
    expect(helper._control.maxAge).toEqual(1000)
    helper.setNumeric('maxAge', 8000)
    expect(helper._control.maxAge).toEqual(1000)
  })

  test('handles setting the private flag correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    expect(helper._control.public).toBeNull()
    expect(helper._control.private).toBeNull()

    helper.private()
    expect(helper._control.public).toEqual(false)
    expect(helper._control.private).toEqual(true)
  })

  test('handles setting the public flag correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper()
    expect(helper._control.public).toBeNull()
    expect(helper._control.private).toBeNull()

    helper.public()
    expect(helper._control.public).toEqual(true)

    helper.private()
    expect(helper._control.public).toEqual(false)

    helper.public()
    expect(helper._control.public).toEqual(false)
  })
})
