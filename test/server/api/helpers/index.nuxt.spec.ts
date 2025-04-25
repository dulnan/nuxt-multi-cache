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

async function mockMultiCacheApp(
  cb: () => Promise<any> | any,
  serverOptions: MultiCacheServerOptions = {},
  config: DeepPartial<MultiCacheRuntimeConfig> = {},
): Promise<void> {
  mocks.useNitroApp.mockReturnValue({
    multiCache: {
      cache: {
        data: {},
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
  test('Skips auth check if defined in config', async () => {
    await mockMultiCacheApp(
      async () => {
        expect(await checkAuth({} as any)).toBeUndefined()
      },
      {},
      {
        api: {
          authorizationDisabled: true,
        },
      },
    )
  })

  test('Performs custom auth check provided in config', async () => {
    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth({} as any),
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
        api: {},
      },
    )
  })

  test('Performs auth check via header token', async () => {
    await mockMultiCacheApp(
      async () => {
        expect(
          await checkAuth({
            node: {
              req: {
                headers: {
                  'x-nuxt-multi-cache-token': 'token',
                },
              },
            },
          } as any),
        ).toBeUndefined()
      },
      {},
      {
        api: {
          authorizationToken: 'token',
        },
      },
    )

    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth({
            node: {
              req: {
                headers: {
                  'x-nuxt-multi-cache-token': 'invalid_token',
                },
              },
            },
          } as any),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unauthorized]`)
      },
      {},
      {
        api: {
          authorizationToken: 'token',
        },
      },
    )

    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth({
            node: {
              req: {
                headers: {
                  'x-nuxt-multi-cache-token': '',
                },
              },
            },
          } as any),
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unauthorized]`)
      },
      {},
      {
        api: {
          authorizationToken: 'token',
        },
      },
    )
  })

  test('Throws error if no authorization config is provided.', async () => {
    await mockMultiCacheApp(
      async () => {
        await expect(
          checkAuth({
            node: {
              req: {
                headers: {
                  'x-nuxt-multi-cache-token': '',
                },
              },
            },
          } as any),
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          `[Error: No authorization configuration option provided.]`,
        )
      },
      {},
      {
        api: {},
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
