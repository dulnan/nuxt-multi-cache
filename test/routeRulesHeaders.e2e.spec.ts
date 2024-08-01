import path from 'path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
import { decodeRouteCacheItem } from '../src/runtime/helpers/cacheItem'

const multiCache: NuxtMultiCacheOptions = {
  route: {
    enabled: true,
  },
  api: {
    enabled: true,
    authorization: false,
    cacheTagInvalidationDelay: 5000,
  },
}
const nuxtConfig: any = {
  multiCache,
}
await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

/**
 * This test checks that our "fake event handler" that prevents Nitro from
 * applying route rules on cached routes works correctly.
 */
describe('Route cache in combination with routeRules', () => {
  test('caches headers set by routeRules', async () => {
    const HEADER = 'Set via routeRules'

    // First request should put it in cache.
    const responseA = await fetch('/api/routeCacheWithRouteRules')

    // The route rules have been applied.
    expect(responseA.headers.get('x-route-rules-header')).toEqual(HEADER)

    // Get the cached item.
    const stats = await fetch('/__nuxt_multi_cache/stats/route', {
      method: 'get',
      headers: {
        'x-nuxt-multi-cache-token': 'hunter2',
      },
    }).then((v) => v.json())

    const cacheItem = stats.rows[0].data
    const decoded = decodeRouteCacheItem(cacheItem)

    // The routeRules header should be stored in the cache.
    expect(decoded?.headers['x-route-rules-header']).toEqual(HEADER)

    // Second request comes from cache.
    const responseB = await fetch('/api/routeCacheWithRouteRules')

    // The headers are not applied from route rules anymore.
    // Instead, because headers were cached originally, they are applied
    // to the response.
    expect(responseB.headers.get('x-route-rules-header')).toEqual(HEADER)
  })

  // During "stale if error", the event handlers are executed as normal,
  // including the "route rules" handler by Nitro. In this scenario, the route
  // cache serves the cached route from the "error" hook, which runs *after*
  // the route rules handler. This is why we don't have the problem anymore
  // with "Cannot set headers after they are sent to the client".
  // This test makes sure that route rules are also applied in this scenario.
  test('caches headers set by routeRules on "stale if error"', async () => {
    const HEADER = 'Set via routeRules'

    // First request should put it in cache.
    const responseA = await fetch('/api/testStaleIfError')

    // The route rules have been applied.
    expect(responseA.headers.get('x-route-rules-header')).toEqual(HEADER)

    // Second request will throw an error and then serve it from cache.
    const responseB = await fetch('/api/testStaleIfError', {
      headers: {
        'x-nuxt-throw-error': 'true',
      },
    })

    expect(responseB.headers.get('x-route-rules-header')).toEqual(HEADER)
  })
})
