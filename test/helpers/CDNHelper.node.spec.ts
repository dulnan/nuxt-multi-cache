import { CacheControl } from '@tusbar/cache-control'
import { describe, expect, test, vi } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'
import {
  DEFAULT_CDN_CONTROL_HEADER,
  DEFAULT_CDN_TAG_HEADER,
} from './../../src/build/options/defaults'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'
import { logger } from '~/src/runtime/helpers/multi-cache-logger'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const mockDateTimestamp = toTimestamp(mockDate)

function getAppliedHeaders(
  helper: NuxtMultiCacheCDNHelper,
): Record<string, string> {
  const headers: Record<string, string> = {}
  const event = {
    node: {
      res: {
        setHeader: (name: string, value: string) => {
          headers[name] = value
        },
      },
    },
  }
  helper.applyToEvent(event as any)
  return headers
}

describe('The CDNHelper', () => {
  test('can be instanciated correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    expect(helper).toBeInstanceOf(NuxtMultiCacheCDNHelper)

    expect(helper._tags).toEqual([])
    expect(helper._control).toBeInstanceOf(CacheControl)
  })

  test('Returns self in every method.', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)

    // Make sure this test fails if new methods are added, so that this test
    // will be updated.
    const methods = Object.getOwnPropertyNames(
      NuxtMultiCacheCDNHelper.prototype,
    )

    expect(methods).toMatchInlineSnapshot(`
      [
        "constructor",
        "applyToEvent",
        "mergeFromResponse",
        "mergeCacheControlHeader",
        "set",
        "addTags",
        "setNumeric",
        "setBoolean",
        "addCustomDirective",
        "private",
        "public",
        "mergeFromCacheItem",
        "mergeFromCacheability",
        "getMaxAge",
        "getStaleIfError",
        "getTags",
      ]
    `)

    // Test all methods to return self.
    expect(helper.set('maxAge', 9000)).toEqual(helper)
    expect(helper.addTags([])).toEqual(helper)
    expect(helper.setNumeric('maxAge', 9000)).toEqual(helper)
    expect(helper.setBoolean('noTransform')).toEqual(helper)
    expect(helper.addCustomDirective('durable')).toEqual(helper)
    expect(helper.private()).toEqual(helper)
    expect(helper.public()).toEqual(helper)
  })

  test('Sets cache control properties', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.set('maxAge', 9999)
    helper.set('noTransform', true)
    expect(helper._control.maxAge).toEqual(9999)
    expect(helper._control.noTransform).toEqual(true)
  })

  test('adds cache tags', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.addTags(['one'])
    expect(helper._tags).toEqual(['one'])

    helper.addTags(['two'])
    expect(helper._tags).toEqual(['one', 'two'])
  })

  test('sets numeric values', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.setNumeric('maxAge', 9999)
    expect(helper._control.maxAge).toEqual(9999)
  })

  test('sets numeric values only if they are lower than the current value', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.setNumeric('maxAge', 1000)
    expect(helper._control.maxAge).toEqual(1000)
    helper.setNumeric('maxAge', 8000)
    expect(helper._control.maxAge).toEqual(1000)
  })

  test('handles setting the private flag correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    expect(helper._control.public).toBeNull()
    expect(helper._control.private).toBeNull()

    helper.private()
    expect(helper._control.public).toEqual(false)
    expect(helper._control.private).toEqual(true)
  })

  test('handles setting the public flag correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    expect(helper._control.public).toBeNull()
    expect(helper._control.private).toBeNull()

    helper.public()
    expect(helper._control.public).toEqual(true)

    helper.private()
    expect(helper._control.public).toEqual(false)

    helper.public()
    expect(helper._control.public).toEqual(false)
  })

  test('mergeFromResponse handles cache tags correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(
      mockDateTimestamp,
      DEFAULT_CDN_CONTROL_HEADER,
      DEFAULT_CDN_TAG_HEADER,
    )

    const mockResponse = {
      headers: {
        get: (header: string) => {
          if (header === DEFAULT_CDN_TAG_HEADER) return 'product user settings'
          return null
        },
      },
    }

    helper.mergeFromResponse(mockResponse as any)
    expect(helper._tags).toEqual(['product', 'user', 'settings'])
  })

  test('mergeFromResponse calls mergeCacheControlHeader with correct value', () => {
    const helper = new NuxtMultiCacheCDNHelper(
      mockDateTimestamp,
      DEFAULT_CDN_CONTROL_HEADER,
      DEFAULT_CDN_TAG_HEADER,
    )
    const spy = vi.spyOn(helper, 'mergeCacheControlHeader')

    const mockResponse = {
      headers: {
        get: (header: string) => {
          if (header === DEFAULT_CDN_CONTROL_HEADER)
            return 'max-age=3600, private'
          return null
        },
      },
    }

    helper.mergeFromResponse(mockResponse as any)
    expect(spy).toHaveBeenCalledWith('max-age=3600, private')
  })

  test('mergeCacheControlHeader handles private flag correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.public()

    helper.mergeCacheControlHeader('private')
    expect(helper._control.private).toEqual(true)
    expect(helper._control.public).toEqual(false)
  })

  test('mergeCacheControlHeader respects existing private flag', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.private()

    helper.mergeCacheControlHeader('public')
    expect(helper._control.private).toEqual(true)
    expect(helper._control.public).toEqual(false)
  })

  test('mergeCacheControlHeader handles numeric properties correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.setNumeric('maxAge', 7200)

    helper.mergeCacheControlHeader('max-age=3600')
    expect(
      helper._control.maxAge,
      'Should update because new value is lower.',
    ).toEqual(3600)

    helper.mergeCacheControlHeader('max-age=5400')
    expect(
      helper._control.maxAge,
      'Should not update because new value is higher.',
    ).toEqual(3600)

    helper.mergeCacheControlHeader('s-maxage=1800')
    expect(
      helper._control.sharedMaxAge,
      'Should set a previously unset property',
    ).toEqual(1800)
  })

  test('mergeCacheControlHeader handles boolean properties correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)

    helper.mergeCacheControlHeader('no-store, no-cache')
    expect(helper._control.noStore, 'Should set boolean properties').toEqual(
      true,
    )
    expect(helper._control.noCache, 'Should set boolean properties').toEqual(
      true,
    )

    // Boolean properties from cache-control are only set if true.
    const anotherHelper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    anotherHelper.setBoolean('noStore')

    // This header doesn't have no-store, but it shouldn't
    // reset the existing true value.
    anotherHelper.mergeCacheControlHeader('max-age=300')
    expect(anotherHelper._control.noStore).toEqual(true)
  })

  test('setBoolean sets boolean values to true', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)

    helper.setBoolean('noStore')
    expect(helper._control.noStore).toEqual(true)

    helper.setBoolean('immutable')
    expect(helper._control.immutable).toEqual(true)
  })

  test('handles complex cache-control header merging correctly', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper.setNumeric('maxAge', 86400)
    helper.public()

    helper.mergeCacheControlHeader(
      'max-age=3600, private, no-store, must-revalidate',
    )

    expect(helper._control.maxAge).toEqual(3600)
    expect(helper._control.private).toEqual(true)
    expect(helper._control.public).toEqual(false)
    expect(helper._control.noStore).toEqual(true)
    expect(helper._control.mustRevalidate).toEqual(true)
  })

  test('addCustomDirective adds directives after the standard directives', () => {
    const helper = new NuxtMultiCacheCDNHelper(
      mockDateTimestamp,
      DEFAULT_CDN_CONTROL_HEADER,
      DEFAULT_CDN_TAG_HEADER,
    )
    helper
      .public()
      .setNumeric('maxAge', 3600)
      .addCustomDirective('durable')
      .addCustomDirective('cdn-ttl', 7200)

    expect(getAppliedHeaders(helper)).toEqual({
      [DEFAULT_CDN_CONTROL_HEADER]:
        'max-age=3600, public, durable, cdn-ttl=7200',
    })
  })

  test('addCustomDirective works without standard directives', () => {
    const helper = new NuxtMultiCacheCDNHelper(
      mockDateTimestamp,
      DEFAULT_CDN_CONTROL_HEADER,
      DEFAULT_CDN_TAG_HEADER,
    )
    helper.addCustomDirective('durable')

    expect(getAppliedHeaders(helper)).toEqual({
      [DEFAULT_CDN_CONTROL_HEADER]: 'durable',
    })
  })

  test('addCustomDirective handles names case-insensitively and replaces existing values', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper
      .addCustomDirective('Durable')
      .addCustomDirective('durable', 'yes')
      .addCustomDirective('CDN-TTL', 60)
      .addCustomDirective('cdn-ttl', 120)

    expect([...helper._customDirectives.values()]).toEqual([
      'durable=yes',
      'cdn-ttl=120',
    ])
  })

  test('addCustomDirective formats values', () => {
    const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
    helper
      .addCustomDirective('token', 'abc')
      .addCustomDirective('list', 'a, b')
      .addCustomDirective('escaped', 'say "hi" \\o/')
      .addCustomDirective('empty', '')
      .addCustomDirective('fraction', 7.9)
      .addCustomDirective('zero', 0)

    expect([...helper._customDirectives.values()]).toEqual([
      'token=abc',
      'list="a, b"',
      'escaped="say \\"hi\\" \\\\o/"',
      'empty=""',
      'fraction=7',
      'zero=0',
    ])
  })

  test.each([
    { reason: 'an empty name', name: '' },
    { reason: 'a name with a comma', name: 'durable, public' },
    { reason: 'a name with an equals sign', name: 'foo=bar' },
    { reason: 'a name with a line break', name: 'foo\r\nbar' },
    { reason: 'a standard directive', name: 'public' },
    { reason: 'a standard directive in uppercase', name: 'Max-Age', value: 1 },
    { reason: 'NaN', name: 'cdn-ttl', value: Number.NaN },
    { reason: 'Infinity', name: 'cdn-ttl', value: Number.POSITIVE_INFINITY },
    { reason: 'a negative number', name: 'cdn-ttl', value: -1 },
    { reason: 'a line break in the value', name: 'foo', value: 'a\r\nb: c' },
    { reason: 'false as the value', name: 'durable', value: false },
  ])(
    'addCustomDirective skips $reason and logs a warning',
    ({ name, value }) => {
      const warn = vi
        .spyOn(logger as typeof console, 'warn')
        .mockImplementation(() => {})
      const helper = new NuxtMultiCacheCDNHelper(mockDateTimestamp)
      helper.addCustomDirective(name, value as any)

      expect(helper._customDirectives.size).toEqual(0)
      expect(warn).toHaveBeenCalledOnce()
      warn.mockRestore()
    },
  )
})
