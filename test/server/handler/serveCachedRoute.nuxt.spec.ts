import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { encodeRouteCacheItem } from '../../../src/runtime/helpers/cacheItem'
import { serveCachedHandler } from '../../../src/runtime/server/handler/serveCachedRoute'
import { onRequest } from '../../../src/runtime/server/hooks/request'
import { NuxtMultiCacheRouteCacheHelper } from '../../../src/runtime/helpers/RouteCacheHelper'
import { MULTI_CACHE_CONTEXT_KEY } from '../../../src/runtime/helpers/server'
import { logger } from '../../../src/runtime/helpers/multi-cache-logger'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

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

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    isServer: true,
    debug: false,
    cdnEnabled: true,
    cdnCacheControlHeader: 'Surrogate-Control',
    cdnCacheTagHeader: 'Cache-Tag',
    isTestMode: true,
    apiPrefix: '/__nuxt_multi_cache',
  }
})

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
    serverOptions: {} as Record<string, any>,
  }
})

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: mocks.serverOptions,
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
  }
})

describe('serveCachedRoute event handler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('Gets a route from cache.', async () => {
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
        serverOptions: {},
        config: {
          cdn: {},
        },
      },
    })

    const setHeaders: Record<string, string> = {}
    const event = {
      method: 'GET',
      path: '/',
      headers: {},
      node: {
        res: {
          setHeader: function (name: string, value: string) {
            setHeaders[name] = value
          },
          statusCode: null,
        },
        req: {
          originalUrl: '/',
          headers: {},
        },
      },
      context: {
        multiCache: {
          // Added by the request hook.
          route: new NuxtMultiCacheRouteCacheHelper(0),
        },
        [MULTI_CACHE_CONTEXT_KEY]: {
          cache: {
            route: {
              storage: {
                getItemRaw() {
                  return Promise.resolve(
                    encodeRouteCacheItem(
                      '<html></html>',
                      {
                        'x-custom-header': 'test',
                      },
                      200,
                      undefined,
                      undefined,
                      undefined,
                      [],
                    ),
                  )
                },
              },
            },
          },
        },
      },
    }

    const result = await serveCachedHandler(event as any)

    expect(result).toMatchInlineSnapshot(`"<html></html>"`)

    expect(event.node.res.statusCode).toMatchInlineSnapshot(`200`)
    expect(setHeaders).toMatchInlineSnapshot(`
      {
        "x-custom-header": "test",
      }
    `)
    mocks.useNitroApp.mockRestore()
  })

  test.each([
    ['GET', '/', true],
    ['HEAD', '/', true],
    ['GET', '/__nuxt_multi_cache_page', true],
    // Other methods.
    ['POST', '/', false],
    ['PUT', '/', false],
    ['DELETE', '/', false],
    // Static files.
    ['GET', '/favicon.ico', false],
    ['GET', '/images/logo.png', false],
    ['GET', '/assets/style.css?v=2', false],
    // Nuxt's assets and the module's API.
    ['GET', '/_nuxt/entry.js', false],
    ['GET', '/__nuxt_multi_cache/stats/route', false],
    ['GET', '/__nuxt_multi_cache/inspect/route?key=foo', false],
  ])(
    'Only looks up routes the route cache applies to (%s %s).',
    async (method, path, served) => {
      // An item exists for every path, e.g. stored by a previous version.
      const getItemRaw = vi.fn(() =>
        Promise.resolve(
          encodeRouteCacheItem(
            '<html></html>',
            {},
            200,
            undefined,
            undefined,
            undefined,
            [],
          ),
        ),
      )
      mocks.useNitroApp.mockReturnValue({
        multiCache: {
          cache: {
            route: {
              storage: {
                getItemRaw,
              },
            },
          },
          serverOptions: {},
          config: {
            cdn: {},
          },
        },
      })

      const event = {
        method,
        path,
        headers: {},
        node: {
          res: {
            setHeader() {},
            statusCode: null,
          },
          req: {
            originalUrl: path,
            headers: {},
          },
        },
        context: {},
      }

      // Nitro calls the request hook before the event handlers.
      await onRequest(event as any)
      const result = await serveCachedHandler(event as any)

      expect(result).toEqual(served ? '<html></html>' : undefined)
      expect(getItemRaw).toHaveBeenCalledTimes(served ? 1 : 0)
      mocks.useNitroApp.mockRestore()
    },
  )

  test.each([
    ['route.applies', { route: { applies: () => false } }],
    ['enabledForRequest', { enabledForRequest: () => Promise.resolve(false) }],
  ])(
    'Does not look up the route if %s returns false.',
    async (_label, serverOptions) => {
      const getItemRaw = vi.fn()
      mocks.useNitroApp.mockReturnValue({
        multiCache: {
          cache: {
            route: {
              storage: {
                getItemRaw,
              },
            },
          },
          serverOptions: {},
          config: {
            cdn: {},
          },
        },
      })
      Object.assign(mocks.serverOptions, serverOptions)

      const event = {
        method: 'GET',
        path: '/',
        headers: {},
        node: {
          res: {},
          req: {
            originalUrl: '/',
            headers: {},
          },
        },
        context: {},
      }

      try {
        await onRequest(event as any)

        expect(await serveCachedHandler(event as any)).toBeUndefined()
        expect(getItemRaw).not.toHaveBeenCalled()
      } finally {
        delete mocks.serverOptions.route
        delete mocks.serverOptions.enabledForRequest
        mocks.useNitroApp.mockRestore()
      }
    },
  )

  test('Respects max age of a cached route', async () => {
    const date = new Date(2022, 11, 29, 13, 0)
    vi.setSystemTime(date)

    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
        serverOptions: {},
        config: {
          cdn: {},
        },
      },
    })

    const setHeaders: Record<string, string> = {}
    const event = {
      method: 'GET',
      path: '/',
      headers: {},
      node: {
        res: {
          setHeader: function (name: string, value: string) {
            setHeaders[name] = value
          },
        },
        req: {
          originalUrl: '/',
          headers: {},
        },
      },
      response: null as Response | null,
      respondWith: function (res: any) {
        this.response = res
      },
      context: {
        [MULTI_CACHE_CONTEXT_KEY]: {
          cache: {
            route: {
              storage: {
                getItemRaw() {
                  return Promise.resolve(
                    encodeRouteCacheItem(
                      '<html></html>',
                      {
                        'x-custom-header': 'test',
                      },
                      200,
                      toTimestamp(date) - 3000,
                      undefined,
                      undefined,
                      [],
                    ),
                  )
                },
              },
            },
          },
        },
        multiCache: {
          route: new NuxtMultiCacheRouteCacheHelper(toTimestamp(date)),
          requestTimestamp: toTimestamp(date),
        },
      },
    }

    // Should not serve from cache because item is stale.
    expect(await serveCachedHandler(event as any)).toBeUndefined()

    // Now set time to one year ago.
    const newDate = new Date(date)
    newDate.setFullYear(2021)
    event.context.multiCache.requestTimestamp = toTimestamp(newDate)
    vi.setSystemTime(newDate)

    const result = await serveCachedHandler(event as any)

    // Is now served from cache because it's not stale anymore.
    expect(result).toMatchInlineSnapshot(`"<html></html>"`)
    mocks.useNitroApp.mockRestore()
  })

  test('Catches errors happening when loading item from cache.', async () => {
    const consoleSpy = vi.spyOn(logger, 'error')
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
        serverOptions: {},
        config: {
          cdn: {},
        },
      },
    })

    const event = {
      method: 'GET',
      path: '/',
      node: {
        req: {
          originalUrl: '/',
          headers: {},
        },
      },
      context: {
        multiCache: {
          route: new NuxtMultiCacheRouteCacheHelper(0),
        },
        [MULTI_CACHE_CONTEXT_KEY]: {
          cache: {
            route: {
              storage: {
                getItemRaw() {
                  throw new Error('Failed to get item from cache.')
                },
              },
            },
          },
        },
      },
    }

    await serveCachedHandler(event as any)

    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Error while attempting to serve cached route for path "/".",
        [Error: Failed to get item from cache.],
      ]
    `)
    mocks.useNitroApp.mockRestore()
  })
})
