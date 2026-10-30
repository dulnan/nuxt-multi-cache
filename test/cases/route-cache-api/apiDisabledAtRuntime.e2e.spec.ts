import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeAll, describe, expect, test } from 'vitest'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
  // The API is enabled in the module options, but disabled at runtime.
  env: {
    NUXT_MULTI_CACHE_API_ENABLED: 'false',
  },
})

describe('The API disabled via runtime config', () => {
  beforeAll(async () => {
    // Stores "shop:products" in the route cache, so that inspecting it would
    // succeed if the API were enabled.
    await fetch('/shop/products')
  })

  test.each([
    ['GET', '/shop/__nuxt_multi_cache/stats/route'],
    ['GET', '/shop/__nuxt_multi_cache/inspect/route?key=shop:products'],
    ['POST', '/shop/__nuxt_multi_cache/purge/all'],
    ['POST', '/shop/__nuxt_multi_cache/purge/tags'],
    ['POST', '/shop/__nuxt_multi_cache/purge/route'],
  ])('responds with 404 to %s %s', async (method, url) => {
    const response = await fetch(url, {
      method,
      // A valid token, so the response is not a 401.
      headers: {
        'x-nuxt-multi-cache-token': 'hunter2',
      },
      body: method === 'POST' ? '[]' : undefined,
    })
    expect(response.status).toEqual(404)
  })
})
