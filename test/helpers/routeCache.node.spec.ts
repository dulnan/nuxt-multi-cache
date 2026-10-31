import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createStorage, normalizeKey } from 'unstorage'
import { getRequestURL, type H3Event } from 'h3'
import type { MultiCacheServerOptions } from '~/src/runtime/types'
import {
  getRouteCacheKey,
  isAmbiguousRoutePath,
  isExcludedRoutePath,
  ROOT_ROUTE_CACHE_KEY,
} from '~/src/runtime/helpers/routeCache'

const mocks = vi.hoisted(() => {
  return {
    serverOptions: {} as MultiCacheServerOptions,
  }
})

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: mocks.serverOptions,
  }
})

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    isServer: true,
    isTestMode: false,
    apiPrefix: '/__nuxt_multi_cache',
  }
})

function buildEvent(path: string): H3Event {
  return {
    path,
    node: {
      req: {
        url: path,
        headers: {
          host: 'localhost',
        },
      },
    },
    context: {},
  } as any
}

describe('getRouteCacheKey', () => {
  beforeEach(() => {
    delete mocks.serverOptions.cacheKeyPrefix
    delete mocks.serverOptions.route
  })

  test('uses the path without the query string', async () => {
    expect(await getRouteCacheKey(buildEvent('/foo/bar?baz=1'))).toEqual(
      '/foo/bar',
    )
  })

  test('uses the root key for the root path', async () => {
    expect(await getRouteCacheKey(buildEvent('/'))).toEqual(
      ROOT_ROUTE_CACHE_KEY,
    )
  })

  test('adds the cache key prefix', async () => {
    mocks.serverOptions.cacheKeyPrefix = 'en'
    expect(await getRouteCacheKey(buildEvent('/foo'))).toEqual('en--/foo')
    expect(await getRouteCacheKey(buildEvent('/'))).toEqual('en--/')
  })

  test.each([
    ['a static empty string', '', '/foo'],
    ['a method returning a prefix', () => Promise.resolve('en'), 'en--/foo'],
    [
      'a method returning an empty string',
      () => Promise.resolve(''),
      '{none}--/foo',
    ],
    [
      'a method returning undefined',
      () => Promise.resolve(undefined),
      '{none}--/foo',
    ],
  ])('with %s as the prefix', async (_label, cacheKeyPrefix, expected) => {
    mocks.serverOptions.cacheKeyPrefix = cacheKeyPrefix as any
    expect(await getRouteCacheKey(buildEvent('/foo'))).toEqual(expected)
  })

  test('without a prefix from the method, a path cannot address the items of a prefix', async () => {
    mocks.serverOptions.cacheKeyPrefix = (event) =>
      Promise.resolve(event.path === '/news' ? 'premium' : '')

    const prefixed = await getRouteCacheKey(buildEvent('/news'))
    const unprefixed = await getRouteCacheKey(buildEvent('/premium--/news'))
    expect(normalizeKey(prefixed)).toEqual('premium--:news')
    expect(normalizeKey(unprefixed)).not.toEqual(normalizeKey(prefixed))
  })

  test('uses a custom buildCacheKey method', async () => {
    mocks.serverOptions.route = {
      buildCacheKey: (event) => 'custom' + getRequestURL(event).pathname,
    }
    expect(await getRouteCacheKey(buildEvent('/foo'))).toEqual('custom/foo')

    mocks.serverOptions.route = {
      buildCacheKey: (event) => getRequestURL(event).pathname,
    }
    expect(await getRouteCacheKey(buildEvent('/'))).toEqual(
      ROOT_ROUTE_CACHE_KEY,
    )
  })

  test('uses a root key that unstorage accepts', async () => {
    const storage = createStorage()
    await expect(storage.setItem('/', 'value')).rejects.toThrow('Invalid key')

    await storage.setItem(ROOT_ROUTE_CACHE_KEY, 'value')
    expect(await storage.getItem(ROOT_ROUTE_CACHE_KEY)).toEqual('value')
  })
})

describe('isExcludedRoutePath', () => {
  const defaultApp = { baseURL: '/', buildAssetsDir: '/_nuxt/' }
  const customApp = { baseURL: '/shop/', buildAssetsDir: '/assets/' }

  test.each([
    ['/_nuxt/entry.js', defaultApp, true],
    ['/__nuxt_error?statusCode=404', defaultApp, true],
    ['/__nuxt_multi_cache/stats/route', defaultApp, true],
    ['/__nuxt_multi_cache_page', defaultApp, false],
    ['/', defaultApp, false],
    ['/products/1', defaultApp, false],
    ['/shop/assets/entry.js', customApp, true],
    ['/shop/__nuxt_error', customApp, true],
    ['/shop/__nuxt_multi_cache/stats/route', customApp, true],
    ['/shop/_nuxt/entry.js', customApp, false],
    ['/shop/', customApp, false],
  ])('%s with base URL %o: %s', (path, app, expected) => {
    expect(isExcludedRoutePath(path, app)).toBe(expected)
  })
})

describe('isAmbiguousRoutePath', () => {
  test.each([
    // Read as a protocol-relative URL by Nuxt.
    ['//contact', true],
    ['//x/checkout', true],
    ['/shop//contact', true],
    ['/a//b', true],
    ['/a/b//', true],
    // Backslashes are slashes in WHATWG URLs.
    ['/\\contact', true],
    ['/a\\b', true],
    // Dot segments are resolved by getRequestURL(), but not by the router.
    ['/a/../contact', true],
    ['/a/./contact', true],
    ['/a/..', true],
    ['/a/.', true],
    ['/..', true],
    ['/.', true],
    ['/', false],
    ['/contact', false],
    ['/a/b/', false],
    ['/a.b', false],
    ['/..a', false],
    ['/a../b', false],
    ['/a/...', false],
    ['/.well-known/foo', false],
    // Only the path is checked, not the query string.
    ['/a?url=//example.com', false],
    ['/a?path=../b', false],
  ])('%s: %s', (path, expected) => {
    expect(isAmbiguousRoutePath(path)).toBe(expected)
  })
})
