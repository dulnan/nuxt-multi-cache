import { describe, expect, test, vi, afterEach } from 'vitest'
import type {
  MultiCacheRuntimeConfig,
  MultiCacheServerOptions,
} from '../../../../src/runtime/types'
import {
  checkAuth,
  getCacheInstance,
} from './../../../../src/runtime/server/api/helpers/index'

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

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

/**
 * Build an event with the given request headers. The response headers are
 * collected in `node.res.headers`.
 */
function buildEvent(requestHeaders: Record<string, string> = {}): any {
  const responseHeaders: Record<string, unknown> = {}
  return {
    node: {
      req: { headers: requestHeaders },
      res: {
        headers: responseHeaders,
        setHeader(name: string, value: unknown) {
          responseHeaders[name] = value
        },
      },
    },
  }
}

async function mockMultiCacheApp(
  cb: () => Promise<any> | any,
  serverOptions: MultiCacheServerOptions = {},
  config: DeepPartial<MultiCacheRuntimeConfig> = {},
): Promise<void> {
  mocks.useNitroApp.mockReturnValue({
    multiCache: {
      cache: {
        data: {
          storage: {},
        },
      },
      serverOptions,
      config,
    },
  })

  await cb()
}

afterEach(() => {
  mocks.useNitroApp.mockRestore()
})

describe('checkAuth', () => {
  test('Sets headers that prevent rendering or caching the response', async () => {
    await mockMultiCacheApp(
      async () => {
        const event = buildEvent()
        await expect(checkAuth(event)).rejects.toMatchObject({
          statusCode: 404,
        })
        expect(event.node.res.headers).toEqual({
          'x-content-type-options': 'nosniff',
          'content-security-policy': "default-src 'none'; sandbox",
          'cache-control': 'private, no-store',
        })
      },
      {},
      {
        api: {
          enabled: false,
        },
      },
    )
  })

  test('Skips auth check if defined in config', async () => {
    await mockMultiCacheApp(
      async () => {
        expect(await checkAuth(buildEvent())).toBeUndefined()
      },
      {},
      {
        api: {
          enabled: true,
          authorizationDisabled: true,
        },
      },
    )
  })

  test('Throws a 404 error if the API is disabled via runtime config', async () => {
    await mockMultiCacheApp(
      async () => {
        await expect(checkAuth(buildEvent())).rejects.toMatchObject({
          statusCode: 404,
        })
      },
      {},
      {
        api: {
          enabled: false,
          // Even if authorization is disabled.
          authorizationDisabled: true,
        },
      },
    )
  })

  test('Performs custom auth check provided in config', async () => {
    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth(buildEvent()),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unauthorized]`)
      },
      {
        api: {
          authorization() {
            return Promise.resolve(false)
          },
        },
      },
      {
        api: {
          enabled: true,
        },
      },
    )
  })

  test('Performs auth check via header token', async () => {
    await mockMultiCacheApp(
      async () => {
        expect(
          await checkAuth(buildEvent({ 'x-nuxt-multi-cache-token': 'token' })),
        ).toBeUndefined()
      },
      {},
      {
        api: {
          enabled: true,
          authorizationToken: 'token',
        },
      },
    )

    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth(
            buildEvent({ 'x-nuxt-multi-cache-token': 'invalid_token' }),
          ),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unauthorized]`)
      },
      {},
      {
        api: {
          enabled: true,
          authorizationToken: 'token',
        },
      },
    )

    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth(buildEvent({ 'x-nuxt-multi-cache-token': '' })),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unauthorized]`)
      },
      {},
      {
        api: {
          enabled: true,
          authorizationToken: 'token',
        },
      },
    )
  })

  test('Requires the token even if authorization is disabled', async () => {
    // For example disabled in nuxt.config.ts for local development, and a
    // token set via runtime config in production.
    const config = {
      api: {
        enabled: true,
        authorizationDisabled: true,
        authorizationToken: 'token',
      },
    }

    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth(buildEvent()),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unauthorized]`)
      },
      {},
      config,
    )

    await mockMultiCacheApp(
      async () => {
        expect(
          await checkAuth(buildEvent({ 'x-nuxt-multi-cache-token': 'token' })),
        ).toBeUndefined()
      },
      {},
      config,
    )
  })

  test('Throws error if no authorization config is provided.', async () => {
    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth(buildEvent({ 'x-nuxt-multi-cache-token': '' })),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `[Error: No authorization configuration option provided.]`,
        )
      },
      {},
      {
        api: {
          enabled: true,
        },
      },
    )
  })
})

describe('getCacheInstance', () => {
  test('Returns the cache instance from the event.', async () => {
    await mockMultiCacheApp(() => {
      expect(
        getCacheInstance({
          context: {
            params: {
              cacheName: 'data',
            },
          },
        } as any),
      ).toBeTruthy()
    })
  })

  test('Throws an error if an invalid cache is requested', async () => {
    await expect(() =>
      mockMultiCacheApp(() =>
        getCacheInstance({
          context: {
            params: {
              cacheName: 'invalid_cache',
            },
          },
        } as any),
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The given cache "invalid_cache" is not available.]`,
    )
  })
})
