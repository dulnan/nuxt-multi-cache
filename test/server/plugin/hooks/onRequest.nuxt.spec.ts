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
  }
})

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
    mocks.serverOptions.route.applies.mockResolvedValue(false)
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {},
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

    expect(mocks.serverOptions.route.applies).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
    mocks.serverOptions.route.applies.mockRestore()
  })

  test('Calls a custom enabledForRequest method', async () => {
    mocks.serverOptions.enabledForRequest.mockResolvedValue(false)
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          route: {},
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

    expect(mocks.serverOptions.enabledForRequest).toHaveBeenCalledOnce()

    mocks.useNitroApp.mockRestore()
    mocks.serverOptions.enabledForRequest.mockRestore()
  })
})
