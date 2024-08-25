import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
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
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe.only('The route cache with compression enabled', () => {
  test('caches a page', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await fetch('/testCompression', {
      method: 'get',
      headers: {
        'accept-encoding': 'br',
      },
    })

    // Get the encoding.
    const firstEncoding = first.headers.get('content-encoding')

    // Test that the compression feature has actually compressed the response.
    expect(firstEncoding).toEqual('br')

    // Second call should get it from cache.
    const second = await fetch('/testCompression', {
      method: 'get',
      headers: {
        'accept-encoding': 'br',
      },
    })

    const responseFirst = await first.text()
    const responseSecond = await second.text()

    // Response should be identical (contains a random number).
    expect(responseFirst).toEqual(responseSecond)

    const secondEncoding = second.headers.get('content-encoding')

    // The encoding should be the same, because the compression feature was
    // able to compress the cached response again.
    expect(secondEncoding).toEqual(firstEncoding)
  })
})
