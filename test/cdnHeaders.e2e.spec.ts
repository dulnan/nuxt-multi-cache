import path from 'path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test, vi } from 'vitest'
import type { ModuleOptions } from '../src/build/options'

const useRuntimeConfig = vi.fn(() => ({
  multiCache: {
    cdn: {
      cacheTagHeader: 'Cache-Tag',
      cacheControlHeader: 'Surrogate-Control',
    },
  },
}))

vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)

const multiCache: ModuleOptions = {
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
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe('The CDN headers feature', () => {
  test('Sets the correct CDN headers', async () => {
    const response = await fetch('/api/cdnHeaders')
    expect(response.headers.get('surrogate-control')).toMatchInlineSnapshot(
      `"max-age=60, must-revalidate, public, stale-while-revalidate=60000, stale-if-error=24000"`,
    )
    expect(response.headers.get('cache-tag')).toMatchInlineSnapshot('"api"')
  })

  test('Does not set headers if useCDNHeaders was not used', async () => {
    const response = await fetch('/api/withoutCdnHeaders')
    expect(response.headers.get('surrogate-control')).toBeNull()
    expect(response.headers.get('cache-tag')).toBeNull()
  })

  test('Merges CDN headers correctly.', async () => {
    const response = await fetch('/cdnHeaderMerging')
    expect(response.headers.get('surrogate-control')).toMatchInlineSnapshot(
      `"max-age=60, must-revalidate, stale-while-revalidate=60000, stale-if-error=24000"`,
      'Uses the lowest max age, set by the page itself.',
    )
    expect(response.headers.get('cache-tag')).toMatchInlineSnapshot(
      `"api page:1 foobar"`,
      'contains both the cache tags from the page and the API call.',
    )
  })

  test('sets headers from error.vue', async () => {
    const response = await fetch('/a-page-that-does-not-exist', {
      headers: {
        Accept: 'text/html',
      },
    })
    expect(response.headers.get('surrogate-control')).toEqual(
      'max-age=60, public',
    )
    expect(response.headers.get('cache-tag')).toEqual('error:404')
  })

  test('sets headers from error.vue, ignoring headers from originating page', async () => {
    const response = await fetch('/triggerServerError', {
      headers: {
        Accept: 'text/html',
      },
    })
    expect(response.headers.get('surrogate-control')).toEqual('private')
    expect(response.headers.get('cache-tag')).toEqual('error:500')
  })
})
