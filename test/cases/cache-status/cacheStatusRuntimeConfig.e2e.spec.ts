import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
  // Disabled in the module options, but enabled with a name at runtime.
  nuxtConfig: {
    multiCache: {
      route: {
        enabled: true,
        cacheStatus: false,
      },
    },
  } as any,
  env: {
    NUXT_MULTI_CACHE_ROUTE_CACHE_STATUS: 'My App',
  },
})

describe('The Cache-Status header enabled via runtime config', () => {
  test('uses the name from runtime config', async () => {
    const response = await fetch('/cached')
    expect(response.headers.get('cache-status')).toEqual(
      '"My App"; fwd=uri-miss; ttl=3600; stored',
    )
  })
})
