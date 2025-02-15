import path from 'node:path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
import { decodeRouteCacheItem } from '../src/runtime/helpers/cacheItem'
import purgeAll from './__helpers__/purgeAll'

const multiCache: NuxtMultiCacheOptions = {
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

  test('handles the request path correctly', async () => {
    await purgeAll()

    // Get the "magic" _payload.json response.
    const payloadResponseFirst = await $fetch(
      '/cachedPageWithRandomNumber/_payload.json',
      {
        method: 'get',
      },
    )

    const payloadResponseSecond = await $fetch(
      '/cachedPageWithRandomNumber/_payload.json',
      {
        method: 'get',
      },
    )
    expect(payloadResponseFirst).toEqual(payloadResponseSecond)

    // Get the actual page.
    const pageResponseFirst = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

    const pageResponseSecond = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

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

    const cache = await $fetch(`/__nuxt_multi_cache/stats/route`, {
      headers: {
        'x-nuxt-multi-cache-token': 'hunter2',
      },
    })

    const cacheItem = decodeRouteCacheItem(cache.rows[0].data)

    expect(cacheItem?.headers['set-cookie']).toEqual(undefined)
  })

  test('does cache the set-cookie header if it is not a session cookie.', async () => {
    await purgeAll()

    // First call puts it into cache.
    await $fetch('/cachedPageWithCountryCookie', {
      method: 'get',
    })

    const cache = await $fetch(`/__nuxt_multi_cache/stats/route`, {
      headers: {
        'x-nuxt-multi-cache-token': 'hunter2',
      },
    })

    const cacheItem = decodeRouteCacheItem(cache.rows[0].data)

    expect(cacheItem?.headers['set-cookie']).toMatchInlineSnapshot(`
      [
        "country=us; Path=/",
      ]
    `)
  })
})
