import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { encodeRouteCacheItem } from '../../../src/runtime/helpers/cacheItem'
import { serveCachedHandler } from '../../../src/runtime/server/handler/serveCachedRoute'
import { MULTI_CACHE_CONTEXT_KEY } from '../../../src/runtime/helpers/server'

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

vi.mock('#multi-cache-server-options', () => {
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
      },
      context: {},

      [MULTI_CACHE_CONTEXT_KEY]: {
        route: {
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
      },
      context: {},
      response: null as Response | null,
      respondWith: function (res: any) {
        this.response = res
      },
      [MULTI_CACHE_CONTEXT_KEY]: {
        route: {
          getItemRaw() {
            return Promise.resolve(
              encodeRouteCacheItem(
                '<html></html>',
                {
                  'x-custom-header': 'test',
                },
                200,
                (date.getTime() - 3000) / 1000,
                undefined,
                undefined,
                [],
              ),
            )
          },
        },
      },
    }

    // Should not serve from cache because item is stale.
    expect(await serveCachedHandler(event as any)).toBeUndefined()

    // Now set time to one year ago.
    vi.setSystemTime(new Date(date).setFullYear(2021))

    const result = await serveCachedHandler(event as any)

    // Is now served from cache because it's not stale anymore.
    expect(result).toMatchInlineSnapshot(`"<html></html>"`)
    mocks.useNitroApp.mockRestore()
  })

  test('Catches errors happening when loading item from cache.', async () => {
    const consoleSpy = vi.spyOn(global.console, 'debug')
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
      node: {},
      context: {},
      [MULTI_CACHE_CONTEXT_KEY]: {
        route: {
          getItemRaw() {
            throw new Error('Failed to get item from cache.')
          },
        },
      },
    }

    await serveCachedHandler(event as any)

    expect(consoleSpy).toHaveBeenCalledWith('Failed to get item from cache.')
    mocks.useNitroApp.mockRestore()
  })
})
