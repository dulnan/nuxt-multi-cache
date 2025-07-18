import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { encodeRouteCacheItem } from '../../../src/runtime/helpers/cacheItem'
import { serveCachedHandler } from '../../../src/runtime/server/handler/serveCachedRoute'
import { MULTI_CACHE_CONTEXT_KEY } from '../../../src/runtime/helpers/server'
import { logger } from '../../../src/runtime/helpers/logger'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

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
      path: '/',
      node: {
        req: {
          originalUrl: '/',
          headers: {},
        },
      },
      context: {
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
