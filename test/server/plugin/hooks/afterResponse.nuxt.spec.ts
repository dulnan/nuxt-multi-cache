import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onAfterResponse } from '../../../../src/runtime/server/hooks/afterResponse'
import { MULTI_CACHE_CONTEXT_KEY } from '../../../../src/runtime/helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../../../src/runtime/helpers/RouteCacheHelper'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const mockDateTimestamp = toTimestamp(mockDate)

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
    expect(
      await onAfterResponse(
        {
          context: {
            multiCacheApp: {
              cache: {
                route: {
                  storage: {},
                },
              },
            },
            multiCache: {
              route: new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
                .setCacheable()
                .setMaxAge(1200),
            },
          },
          node: {
            res: {
              statusCode: 200,
              getHeaders: () => {
                return {}
              },
            },
            req: {
              originalUrl: '/',
              headers: {},
            },
          },
        } as any,
        { body: null } as any,
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
          context: {},
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
            multiCache: {
              route: new NuxtMultiCacheRouteCacheHelper(
                mockDateTimestamp,
              ).setUncacheable(),
            },
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
            multiCache: {
              route: new NuxtMultiCacheRouteCacheHelper(
                mockDateTimestamp,
              ).setCacheable(),
            },
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
    const date = new Date(2022, 11, 29, 13, 0, 0, 0)
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
        multiCacheApp: {
          cache: {
            route: {
              storage: {
                setItemRaw(key: string, item: any, options: any) {
                  storedItems.push({ key, item, options })
                  return Promise.resolve()
                },
              },
            },
          },
        },
        multiCache: {
          route: new NuxtMultiCacheRouteCacheHelper(toTimestamp(date))
            .setCacheable()
            .setMaxAge(1200),
        },
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
        "item": "{"headers":{"x-test":"foobar"},"statusCode":200,"expires":1672320000,"cacheTags":[],"staleIfErrorExpires":0,"staleWhileRevalidate":false}<CACHE_ITEM><html></html>",
        "key": "/foobar",
        "options": {
          "ttl": 1200,
        },
      }
    `)

    mocks.useNitroApp.mockRestore()
  })
})
