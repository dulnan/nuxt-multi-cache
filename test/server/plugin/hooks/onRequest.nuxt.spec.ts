import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onRequest } from '../../../../dist/runtime/server/hooks/request'
import { encodeRouteCacheItem } from '../../../../dist/runtime/helpers/cacheItem'

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

describe('onRequest nitro hook handler', () => {
  test('does not apply for common asset file extensions', async () => {
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
        serverOptions: {
          api: {
            authorization: () => {
              return Promise.resolve(true)
            },
          },
        },
      },
    })
    const event: any = {
      path: '/test.jpg',
      node: {
        res: {},
      },
      context: {},
    }

    expect(await onRequest(event)).toBeUndefined()
    mocks.useNitroApp.mockRestore()
  })

  test('Calls a custom applies method', async () => {
    const routeOptions = {
      applies: function () {
        return false
      },
    }
    const spy = vi.spyOn(routeOptions, 'applies')
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
        serverOptions: {
          route: routeOptions,
        },
      },
    })
    const event: any = {
      path: '/test',
      node: {
        res: {},
      },
      context: {},
    }

    await onRequest(event)

    expect(spy).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
  })

  test('Calls a custom enabledForRequest method', async () => {
    const serverOptions = {
      enabledForRequest: function () {
        return Promise.resolve(false)
      },
    }
    const spy = vi.spyOn(serverOptions, 'enabledForRequest')
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
        serverOptions,
      },
    })
    const event: any = {
      path: '/test',
      node: {
        res: {},
      },
      context: {},
    }

    await onRequest(event)

    expect(spy).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
  })

  test('Gets a route from cache.', async () => {
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
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
                  [],
                ),
              )
            },
          },
        },
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
    }

    await onRequest(event as any)

    expect(event.response).toBeTruthy()
    expect(await event.response?.text()).toMatchInlineSnapshot(
      `"<html></html>"`,
    )

    expect(event.response?.status).toMatchInlineSnapshot(`200`)
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
        cache: {
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
                  [],
                ),
              )
            },
          },
        },
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
    }

    // Should not serve from cache because item is stale.
    expect(await onRequest(event as any)).toBeUndefined()

    // Now set time to one year ago.
    vi.setSystemTime(new Date(date).setFullYear(2021))

    await onRequest(event as any)

    // Is now served from cache because it's not stale anymore.
    expect(event.response).toBeTruthy()
    mocks.useNitroApp.mockRestore()
  })

  test('Catches errors happening when loading item from cache.', async () => {
    const consoleSpy = vi.spyOn(global.console, 'debug')
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {
            getItemRaw() {
              throw new Error('Failed to get item from cache.')
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
      path: '/',
      node: {},
      context: {},
    }

    await onRequest(event as any)

    expect(consoleSpy).toHaveBeenCalledWith('Failed to get item from cache.')
    mocks.useNitroApp.mockRestore()
  })
})
