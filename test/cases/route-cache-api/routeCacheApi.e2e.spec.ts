import path from 'node:path'
import { setup, $fetch, fetch, getBrowser, url } from '@nuxt/test-utils/e2e'
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

  test.each([
    ['authorized', { 'x-nuxt-multi-cache-token': 'hunter2' }, 200],
    ['unauthorized', {}, 401],
  ])(
    'does not make %s responses of the API cacheable on the CDN',
    async (_label, headers, status) => {
      // The middleware's CDN header works for other routes.
      const page = await fetch('/shop/products')
      expect(page.headers.get('surrogate-control')).toEqual(
        'max-age=604800, public',
      )

      const response = await fetch(STATS_URL, { headers, redirect: 'manual' })
      expect(response.status).toEqual(status)
      expect(response.headers.get('cache-control')).toEqual('private, no-store')

      const cdnHeader = response.headers.get('surrogate-control')!
      expect(cdnHeader).toContain('private')
      expect(cdnHeader).toContain('no-store')
      expect(cdnHeader).toContain('max-age=0')
      expect(cdnHeader).not.toContain('public')
    },
  )
})

describe('The inspect endpoint', () => {
  test('sends stored route cache items as plain text', async () => {
    // Stored in the route cache by the middleware.
    await $fetch('/shop/api/comments')
    const inspectUrl =
      '/shop/__nuxt_multi_cache/inspect/route?key=shop:api:comments'

    // The comment's markup doesn't run when the item is opened in a browser.
    const browser = await getBrowser()
    const page = await browser.newPage({
      extraHTTPHeaders: {
        'x-nuxt-multi-cache-token': 'hunter2',
      },
    })
    await page.goto(url(inspectUrl))
    expect(await page.content()).toContain('onerror')
    expect(await page.title()).not.toEqual('1337')
    await page.close()

    const response = await fetch(inspectUrl, {
      headers: {
        'x-nuxt-multi-cache-token': 'hunter2',
      },
    })
    expect(response.headers.get('content-type')).toEqual(
      'text/plain; charset=utf-8',
    )
    expect(response.headers.get('x-content-type-options')).toEqual('nosniff')
    expect(response.headers.get('content-security-policy')).toEqual(
      "default-src 'none'; sandbox",
    )
  })
})
