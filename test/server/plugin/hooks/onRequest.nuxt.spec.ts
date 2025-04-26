import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { onRequest } from '../../../../src/runtime/server/hooks/request'

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
        req: {
          originalUrl: '/test',
          headers: {},
        },
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
        req: {
          originalUrl: '/test',
          headers: {},
        },
      },
      context: {},
    }

    await onRequest(event)

    expect(spy).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
  })
})
