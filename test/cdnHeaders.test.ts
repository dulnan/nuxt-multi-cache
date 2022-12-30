import { fileURLToPath } from 'node:url'
import { setup, fetch } from '@nuxt/test-utils'
import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheOptions } from '../src/runtime/types'

describe('The CDN headers feature', async () => {
  const multiCache: NuxtMultiCacheOptions = {
    component: {
      enabled: true,
    },
    data: {
      enabled: true,
    },
    route: {
      enabled: true,
    },
    cdn: {
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
    // browser: true,
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig,
  })

  test('Sets the correct CDN headers', async () => {
    const response = await fetch('/api/cdnHeaders')
    expect(response.headers.get('surrogate-control')).toMatchInlineSnapshot(
      '"max-age=0, must-revalidate, public, stale-while-revalidate=60000, stale-if-error=24000"',
    )
    expect(response.headers.get('cache-tag')).toMatchInlineSnapshot(
      '"page:1 image:234 user:32 language translations"',
    )
  })

  test('Does not set headers if useCDNHeaders was not used', async () => {
    const response = await fetch('/api/withoutCdnHeaders')
    expect(response.headers.get('surrogate-control')).toBeNull()
    expect(response.headers.get('cache-tag')).toBeNull()
  })
})
