import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'

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
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

async function testResponse(path: string) {
  // First call puts it into cache.
  const first = await fetch(path, {
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
  const second = await fetch(path, {
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

  return { first, second, responseSecond }
}

describe('The route cache with compression enabled', () => {
  test('caches a page', async () => {
    await purgeAll()
    await testResponse('/testCompression')
  })

  test('caches the result of an API handler', async () => {
    await purgeAll()
    await testResponse('/api/testApiCompression')
  })

  test('caches the JSON result of an API handler', async () => {
    await purgeAll()
    const { first, second, responseSecond } = await testResponse(
      '/api/testApiCompressionJson',
    )

    // The cached response must still be served as JSON.
    expect(first.headers.get('content-type')).toContain('application/json')
    expect(second.headers.get('content-type')).toContain('application/json')

    // The response served from cache decodes to the original object, so the
    // uncompressed JSON was stored in the cache, not the compressed bytes.
    expect(JSON.parse(responseSecond)).toEqual({
      message: 'This is a compressed JSON API response',
      number: expect.any(Number),
    })
  })
})
