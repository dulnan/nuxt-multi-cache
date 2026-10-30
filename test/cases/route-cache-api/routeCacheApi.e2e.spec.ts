import path from 'node:path'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { CacheStatsResponse } from '~/src/runtime/types'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

// The app uses "/shop/" as its base URL.
const STATS_URL = '/shop/__nuxt_multi_cache/stats/route'

function getRouteCacheKeys(): Promise<string[]> {
  return $fetch<CacheStatsResponse<string>>(STATS_URL, {
    headers: {
      'x-nuxt-multi-cache-token': 'hunter2',
    },
  }).then((response) => response.rows.map((row) => row.key))
}

describe('A middleware that makes every route cacheable', () => {
  test('does not cache the responses of the API', async () => {
    // The middleware works: The page is stored in the route cache.
    await $fetch('/shop/products')
    expect(await getRouteCacheKeys()).toContain('shop:products')

    // The authorized stats request was not stored, so a request without the
    // token is rejected instead of getting the cached response.
    const unauthorized = await fetch(STATS_URL, { redirect: 'manual' })
    expect(unauthorized.status).toEqual(401)

    const apiKeys = (await getRouteCacheKeys()).filter((key) =>
      key.includes('__nuxt_multi_cache'),
    )
    expect(apiKeys).toEqual([])
  })
})
