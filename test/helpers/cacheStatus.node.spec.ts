import { describe, expect, test } from 'vitest'
import {
  appendCacheStatus,
  getCacheStatusName,
  getCacheStatusTtl,
  serializeCacheStatus,
} from '~/src/runtime/helpers/cacheStatus'

describe('getCacheStatusName', () => {
  test.each([
    [true, 'nuxt-multi-cache'],
    ['my-app', 'my-app'],
    ['shop.example.com', 'shop.example.com'],
    ['My App', '"My App"'],
    ['say "hi" \\o/', '"say \\"hi\\" \\\\o/"'],
    // Only printable ASCII can be sent.
    ['Café', 'nuxt-multi-cache'],
  ])('sends %j as %s', (option, expected) => {
    expect(getCacheStatusName(option)).toEqual(expected)
  })

  test.each([false, '', ' ', undefined, null, 1])(
    'disables the header for %j',
    (option) => {
      expect(getCacheStatusName(option)).toBeUndefined()
    },
  )
})

describe('getCacheStatusTtl', () => {
  const now = 1_800_000_000

  test.each([
    [now + 100, 100],
    [now - 60, -60],
    // Items with a max age of 0 are never fresh.
    [0, 0],
    // Permanent items have no expiry.
    [-1, undefined],
  ])('returns the ttl for an item that expires at %j', (expires, expected) => {
    expect(getCacheStatusTtl(expires, now)).toEqual(expected)
  })
})

describe('serializeCacheStatus', () => {
  test.each([
    [{ hit: true }, 'name; hit'],
    [{ hit: true, ttl: 376 }, 'name; hit; ttl=376'],
    [{ hit: true, ttl: -12 }, 'name; hit; ttl=-12'],
    [{ fwd: 'bypass' as const }, 'name; fwd=bypass'],
    [{ fwd: 'method' as const }, 'name; fwd=method'],
    [{ fwd: 'uri-miss' as const }, 'name; fwd=uri-miss'],
    [
      { fwd: 'uri-miss' as const, ttl: 3600, stored: true },
      'name; fwd=uri-miss; ttl=3600; stored',
    ],
    [{ fwd: 'stale' as const, stored: true }, 'name; fwd=stale; stored'],
    [
      { fwd: 'stale' as const, fwdStatus: 503, ttl: -60 },
      'name; fwd=stale; fwd-status=503; ttl=-60',
    ],
  ])('serializes %j', (status, expected) => {
    expect(serializeCacheStatus('name', status)).toEqual(expected)
  })
})

describe('appendCacheStatus', () => {
  test.each([
    [undefined, 'name; hit'],
    ['', 'name; hit'],
    ['upstream; hit', 'upstream; hit, name; hit'],
    [['a; hit', 'b; fwd=uri-miss'], 'a; hit, b; fwd=uri-miss, name; hit'],
  ])('appends the entry to %j', (existing, expected) => {
    expect(appendCacheStatus(existing, 'name; hit')).toEqual(expected)
  })
})
