import { describe, expect, test, vi } from 'vitest'
import type { H3Event } from 'h3'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onBeforeResponse } from '../../../../src/runtime/server/hooks/beforeResponse'
import { MULTI_CACHE_CDN_CONTEXT_KEY } from '../../../../src/runtime/helpers/server'
import { NuxtMultiCacheCDNHelper } from '../../../../src/runtime/helpers/CDNHelper'

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        cdn: {
          cacheTagHeader: 'Cache-Tag',
          cacheControlHeader: 'Surrogate-Control',
        },
      },
    }
  }
})

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: {},
  }
})

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
  }
})

describe('beforeResponse nitro hook handler', () => {
  test('Sets the CDN headers', () => {
    const date = new Date(2022, 11, 29, 13, 0)
    vi.setSystemTime(date)

    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {},
        },
        serverOptions: {},
        config: {
          cdn: {
            cacheTagHeader: 'Cache-Tag',
            cacheControlHeader: 'Surrogate-Control',
          },
        },
      },
    })

    const setHeaders: Record<string, any> = {}

    const cdnHelper = new NuxtMultiCacheCDNHelper()
      .setNumeric('maxAge', 9000)
      .setNumeric('staleIfError', 33333)
      .private()
      .addTags(['one', 'two'])

    const event = {
      path: '/foobar',
      [MULTI_CACHE_CDN_CONTEXT_KEY]: cdnHelper,

      node: {
        res: {
          statusCode: 200,
          setHeader(name: string, value: any) {
            setHeaders[name] = value
            return this
          },
        },
      },
    }

    onBeforeResponse(event as H3Event, {} as any)

    expect(setHeaders).toMatchInlineSnapshot(`
      {
        "Cache-Tag": "one two",
        "Surrogate-Control": "max-age=9000, private, stale-if-error=33333",
      }
    `)

    mocks.useNitroApp.mockRestore()
  })
})
