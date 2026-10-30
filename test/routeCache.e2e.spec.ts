import path from 'node:path'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import { decodeRouteCacheItem } from '../src/runtime/helpers/cacheItem'
import purgeAll from './__helpers__/purgeAll'
import type { CacheStatsResponse } from './../src/runtime/types'

const multiCache: ModuleOptions = {
  component: {
    enabled: false,
  },
  data: {
    enabled: false,
  },
  route: {
    enabled: true,
  },
  cdn: {
    enabled: false,
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
  // browser: true,
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe('The route cache feature', () => {
  test('caches a page', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

    // Second call should get it from cache.
    const second = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

    expect(first).toEqual(second)
  })

  test('only serves and stores GET and HEAD requests', async () => {
    await purgeAll()

    const getStats = () =>
      $fetch<CacheStatsResponse<string>>(`/__nuxt_multi_cache/stats/route`, {
        headers: {
          'x-nuxt-multi-cache-token': 'hunter2',
        },
      })

    // Put the page into cache.
    const get = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

    // A POST request to the same path must reach the handler instead of
    // getting the cached GET response.
    const post = await $fetch('/cachedPageWithRandomNumber', {
      method: 'post',
    })
    expect(post).not.toEqual(get)

    // HEAD requests still work for a cached path.
    const head = await fetch('/cachedPageWithRandomNumber', {
      method: 'head',
    })
    expect(head.status).toEqual(200)

    await purgeAll()

    // The response to a POST request is not stored.
    await $fetch('/cachedPageWithRandomNumber', {
      method: 'post',
    })
    expect((await getStats()).rows).toHaveLength(0)

    // The response to a GET request is.
    await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })
    expect((await getStats()).rows).toHaveLength(1)
  })

  test('handles the request path correctly', async () => {
    await purgeAll()

    // Get the "magic" _payload.json response. Nuxt only renders it for pages
    // with payload extraction, which this page enables using an `isr` route
    // rule. While rendering it, Nuxt rewrites the request path to the page
    // path, which must not be used for the cache key (#92).
    const payloadResponseFirst = await $fetch(
      '/cachedPageWithPayload/_payload.json',
      {
        method: 'get',
      },
    )

    const payloadResponseSecond = await $fetch(
      '/cachedPageWithPayload/_payload.json',
      {
        method: 'get',
      },
    )
    expect(Array.isArray(payloadResponseFirst)).toBe(true)
    expect(payloadResponseFirst).toEqual(payloadResponseSecond)

    // Get the actual page.
    const pageResponseFirst = await $fetch<string>('/cachedPageWithPayload', {
      method: 'get',
    })

    const pageResponseSecond = await $fetch<string>('/cachedPageWithPayload', {
      method: 'get',
    })

    expect(pageResponseFirst).toMatch(/^<!DOCTYPE html>/i)
    expect(pageResponseFirst).toEqual(pageResponseSecond)

    // The payload and page responses must be different.
    expect(payloadResponseSecond).not.toEqual(pageResponseSecond)
  })

  test('does not cache a page marked uncacheable', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await $fetch('/uncacheablePage', {
      method: 'get',
    })

    // Second call should get it from cache.
    const second = await $fetch('/uncacheablePage', {
      method: 'get',
    })

    expect(first).not.toEqual(second)
  })

  test('does not cache the set-cookie header if it is a session cookie.', async () => {
    await purgeAll()

    // First call puts it into cache.
    await $fetch('/cachedPageWithSessionCookie', {
      method: 'get',
    })

    const cache = await $fetch<CacheStatsResponse<string>>(
      `/__nuxt_multi_cache/stats/route`,
      {
        headers: {
          'x-nuxt-multi-cache-token': 'hunter2',
        },
      },
    )

    const cacheItem = decodeRouteCacheItem(cache.rows[0]!.data)

    expect(cacheItem?.headers['set-cookie']).toEqual(undefined)
  })

  test('does cache the set-cookie header if it is not a session cookie.', async () => {
    await purgeAll()

    // First call puts it into cache.
    await $fetch('/cachedPageWithCountryCookie', {
      method: 'get',
    })

    const cache = await $fetch<CacheStatsResponse<string>>(
      `/__nuxt_multi_cache/stats/route`,
      {
        headers: {
          'x-nuxt-multi-cache-token': 'hunter2',
        },
      },
    )

    const cacheItem = decodeRouteCacheItem(cache.rows[0]!.data)

    expect(cacheItem?.headers['set-cookie']).toMatchInlineSnapshot(
      `"country=us; Path=/"`,
    )
  })
})
