import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onAfterResponse } from '../../../../src/runtime/server/hooks/afterResponse'
import { MULTI_CACHE_CONTEXT_KEY } from '../../../../src/runtime/helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../../../src/runtime/helpers/RouteCacheHelper'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const mockDateTimestamp = toTimestamp(mockDate)

mockNuxtImport('useRuntimeConfig', (original) => {
  return () => {
    return {
      // Keep the real config, e.g. app.baseURL is needed by Nuxt's router plugin.
      ...original(),
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

  test.each([
    ['permanent', (h: NuxtMultiCacheRouteCacheHelper) => h, undefined],
    [
      'max age with longer stale-if-error',
      (h: NuxtMultiCacheRouteCacheHelper) =>
        h.setMaxAge(60).setStaleIfError(3600),
      3600,
    ],
    [
      'max age 0 with stale-if-error',
      (h: NuxtMultiCacheRouteCacheHelper) =>
        h.setMaxAge(0).setStaleIfError(9000),
      9000,
    ],
    [
      'max age with SWR',
      (h: NuxtMultiCacheRouteCacheHelper) =>
        h.setMaxAge(60).allowStaleWhileRevalidate(),
      undefined,
    ],
    [
      'max age 0 with SWR',
      (h: NuxtMultiCacheRouteCacheHelper) =>
        h.setMaxAge(0).allowStaleWhileRevalidate(),
      undefined,
    ],
    ['max age 0', (h: NuxtMultiCacheRouteCacheHelper) => h.setMaxAge(0), null],
  ])(
    'Stores the item with the correct TTL (%s)',
    async (_label, configure, expectedTtl) => {
      vi.setSystemTime(mockDate)

      const storedItems: any[] = []
      const removeKeyBeingRevalidated = vi.fn()

      mocks.useNitroApp.mockReturnValue({
        multiCache: {
          cache: {
            route: {},
          },
          serverOptions: {},
          state: {
            removeKeyBeingRevalidated,
          },
          config: {
            cdn: {},
          },
        },
      })

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
            route: configure(
              new NuxtMultiCacheRouteCacheHelper(
                mockDateTimestamp,
              ).setCacheable(),
            ),
            routeRevalidationkey: '/foobar',
          },
        },
        node: {
          res: {
            statusCode: 200,
            getHeaders() {
              return {}
            },
          },
          req: {
            originalUrl: '/foobar',
            headers: {},
          },
        },
      } as any

      await onAfterResponse(event, { body: '<html></html>' } as any)

      if (expectedTtl === null) {
        // Never served from cache, so it's not stored.
        expect(storedItems).toHaveLength(0)
      } else {
        expect(storedItems).toHaveLength(1)
        expect(storedItems[0].options).toEqual({ ttl: expectedTtl })
      }

      // The revalidation key is removed, even if the item is not stored.
      expect(removeKeyBeingRevalidated).toHaveBeenCalledWith('/foobar')

      mocks.useNitroApp.mockRestore()
    },
  )

  test.each([
    ['no body', 200, true, undefined, false],
    ['status 404', 404, true, '<html></html>', false],
    ['not cacheable', 200, false, '<html></html>', false],
    ['store failed with bubbleError', 200, true, '<html></html>', true],
  ])(
    'Releases the revalidation key if the response is not stored (%s)',
    async (_label, statusCode, cacheable, body, failToStore) => {
      vi.setSystemTime(mockDate)

      const removeKeyBeingRevalidated = vi.fn()

      mocks.useNitroApp.mockReturnValue({
        multiCache: {
          cache: {
            route: {},
          },
          serverOptions: {},
          state: {
            removeKeyBeingRevalidated,
          },
          config: {
            cdn: {},
          },
        },
      })

      const helper = new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp)
        .setMaxAge(60)
        .allowStaleWhileRevalidate()
      if (cacheable) {
        helper.setCacheable()
      } else {
        helper.setUncacheable()
      }

      const event = {
        path: '/foobar',
        context: {
          multiCacheApp: {
            cache: {
              route: {
                bubbleError: true,
                storage: {
                  setItemRaw() {
                    return failToStore
                      ? Promise.reject(new Error('Failed to store.'))
                      : Promise.resolve()
                  },
                },
              },
            },
          },
          multiCache: {
            route: helper,
            routeRevalidationkey: '/foobar',
          },
        },
        node: {
          res: {
            statusCode,
            getHeaders() {
              return {}
            },
          },
          req: {
            originalUrl: '/foobar',
            headers: {},
          },
        },
      } as any

      const result = onAfterResponse(event, { body } as any)
      if (failToStore) {
        await expect(result).rejects.toThrow('Failed to store.')
      } else {
        await result
      }

      expect(removeKeyBeingRevalidated).toHaveBeenCalledWith('/foobar')

      mocks.useNitroApp.mockRestore()
    },
  )
})
