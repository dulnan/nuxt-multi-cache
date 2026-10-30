import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onRequest } from '../../../../src/runtime/server/hooks/request'

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return true
    },
    debug: false,
    isTestMode: true,
    apiPrefix: '/__nuxt_multi_cache',
  }
})

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

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
    serverOptions: {
      enabledForRequest: vi.fn(),
      route: {
        applies: vi.fn(),
      },
    },
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
  }
})

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: mocks.serverOptions,
  }
})

describe('onRequest nitro hook handler', () => {
  test('does not apply for common asset file extensions', async () => {
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {},
      },
    })
    const event: any = {
      method: 'GET',
      path: '/test.jpg',
      node: {
        res: {},
        req: {
          originalUrl: '/test.jpg',
          headers: {},
        },
      },
      context: {},
    }

    expect(await onRequest(event)).toBeUndefined()
    mocks.useNitroApp.mockRestore()
  })

  test('Calls a custom applies method', async () => {
    mocks.serverOptions.route.applies.mockReturnValue(false)
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {},
        },
      },
    })
    const event: any = {
      method: 'GET',
      path: '/test',
      node: {
        res: {},
        req: {
          originalUrl: '/test',
          headers: {},
        },
      },
      context: {},
    }

    await onRequest(event)

    expect(mocks.serverOptions.route.applies).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
    mocks.serverOptions.route.applies.mockRestore()
  })

  test.each([
    ['GET', true],
    ['HEAD', true],
    ['POST', false],
    ['PUT', false],
    ['PATCH', false],
    ['DELETE', false],
  ])(
    'Only adds the route cache helper for GET and HEAD requests (%s)',
    async (method, expected) => {
      mocks.serverOptions.route.applies.mockReturnValue(true)
      mocks.serverOptions.enabledForRequest.mockResolvedValue(true)
      mocks.useNitroApp.mockReturnValue({
        multiCache: {
          cache: {
            route: {},
          },
        },
      })
      const event: any = {
        method,
        path: '/test',
        node: {
          res: {},
          req: {
            originalUrl: '/test',
            headers: {},
          },
        },
        context: {},
      }

      await onRequest(event)

      // Without the helper, the response is never stored in the route cache.
      expect(!!event.context.multiCache?.route).toBe(expected)

      mocks.useNitroApp.mockRestore()
      mocks.serverOptions.route.applies.mockRestore()
      mocks.serverOptions.enabledForRequest.mockRestore()
    },
  )

  test.each([
    ['/__nuxt_multi_cache/stats/route', false],
    ['/__nuxt_multi_cache/inspect/route?key=foo', false],
    ['/_nuxt/entry.js', false],
    ['/__nuxt_error', false],
    ['/__nuxt_multi_cache_page', true],
  ])(
    'Never adds the route cache helper for excluded paths (%s)',
    async (path, expected) => {
      // Even if a custom applies method allows it.
      mocks.serverOptions.route.applies.mockReturnValue(true)
      mocks.serverOptions.enabledForRequest.mockResolvedValue(true)
      mocks.useNitroApp.mockReturnValue({
        multiCache: {
          cache: {
            route: {},
          },
        },
      })
      const event: any = {
        method: 'GET',
        path,
        node: {
          res: {},
          req: {
            originalUrl: path,
            headers: {},
          },
        },
        context: {},
      }

      await onRequest(event)

      expect(!!event.context.multiCache?.route).toBe(expected)

      mocks.useNitroApp.mockRestore()
      mocks.serverOptions.route.applies.mockRestore()
      mocks.serverOptions.enabledForRequest.mockRestore()
    },
  )

  test('Calls a custom enabledForRequest method', async () => {
    mocks.serverOptions.route.applies.mockReturnValue(true)
    mocks.serverOptions.enabledForRequest.mockResolvedValue(false)
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {},
        },
      },
    })
    const event: any = {
      method: 'GET',
      path: '/test',
      node: {
        res: {},
        req: {
          originalUrl: '/test',
          headers: {},
        },
      },
      context: {},
    }

    await onRequest(event)

    expect(mocks.serverOptions.enabledForRequest).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
    mocks.serverOptions.route.applies.mockRestore()
    mocks.serverOptions.enabledForRequest.mockRestore()
  })
})
