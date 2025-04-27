import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onAfterResponse } from '../../../../src/runtime/server/hooks/afterResponse'
import {
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
} from '../../../../src/runtime/helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../../../src/runtime/helpers/RouteCacheHelper'

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

describe('afterResponse nitro hook handler', () => {
  test('Returns if response.body is not a string', async () => {
    expect(
      await onAfterResponse(
        {
          node: {
            res: {
              statusCode: 200,
            },
            req: {
              originalUrl: '/',
              headers: {},
            },
          },
        } as any,
        { body: {} } as any,
      ),
    ).toBeUndefined()

    expect(
      await onAfterResponse({} as any, { body: null } as any),
    ).toBeUndefined()
  })

  test('Returns if route cache is not available', async () => {
    expect(
      await onAfterResponse(
        {
          node: {
            res: {
              statusCode: 200,
            },
            req: {
              originalUrl: '/',
              headers: {},
            },
          },
        } as any,
        { body: '<html></html>' } as any,
      ),
    ).toBeUndefined()
  })

  test('Returns if route is not cacheable', async () => {
    expect(
      await onAfterResponse(
        {
          context: {
            [MULTI_CACHE_CONTEXT_KEY]: {
              route: {},
            },
            [MULTI_CACHE_ROUTE_CONTEXT_KEY]:
              new NuxtMultiCacheRouteCacheHelper().setUncacheable(),
          },
          node: {
            res: {
              statusCode: 200,
            },
            req: {
              originalUrl: '/',
              headers: {},
            },
          },
        } as any,
        { body: '<html></html>' } as any,
      ),
    ).toBeUndefined()
  })

  test('Returns if status code is not 200', async () => {
    expect(
      await onAfterResponse(
        {
          context: {
            [MULTI_CACHE_CONTEXT_KEY]: {
              route: {},
            },
            [MULTI_CACHE_ROUTE_CONTEXT_KEY]:
              new NuxtMultiCacheRouteCacheHelper().setCacheable(),
          },

          node: {
            res: {
              statusCode: 404,
            },
            req: {
              originalUrl: '/',
              headers: {},
            },
          },
        } as any,
        {
          body: '<html></html>',
        } as any,
      ),
    ).toBeUndefined()
  })

  test('Puts a cacheable item in cache.', async () => {
    const date = new Date(2022, 11, 29, 13, 0)
    vi.setSystemTime(date)

    const storedItems: any[] = []

    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {},
        },
        serverOptions: {},
        config: {
          cdn: {},
        },
      },
    })

    const outgoingHeaders = {
      'x-test': 'foobar',
    }

    const event = {
      path: '/foobar',
      context: {
        [MULTI_CACHE_CONTEXT_KEY]: {
          route: {
            storage: {
              setItemRaw(key: string, item: any, options: any) {
                storedItems.push({ key, item, options })
                return Promise.resolve()
              },
            },
          },
        },
        [MULTI_CACHE_ROUTE_CONTEXT_KEY]: new NuxtMultiCacheRouteCacheHelper()
          .setCacheable()
          .setMaxAge(1200),
      },

      node: {
        res: {
          statusCode: 200,
          getHeaders() {
            return outgoingHeaders
          },
        },
        req: {
          originalUrl: '/foobar',
          headers: {},
        },
      },
    } as any

    const response = {
      body: '<html></html>',
    } as any

    await onAfterResponse(event, response)

    expect(storedItems[0]).toMatchInlineSnapshot(`
      {
        "item": "{"headers":{"x-test":"foobar"},"statusCode":200,"expires":1672320000,"cacheTags":[],"staleWhileRevalidate":false}<CACHE_ITEM><html></html>",
        "key": "/foobar",
        "options": {
          "ttl": 1200,
        },
      }
    `)

    mocks.useNitroApp.mockRestore()
  })
})
