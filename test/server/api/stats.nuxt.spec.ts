import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import stats from './../../../src/runtime/server/api/stats'

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {},
    }
  }
})

vi.mock('h3', async () => {
  const h3: any = await vi.importActual('h3')
  return {
    ...h3,
    readBody: (event: any) => {
      return event.body
    },
  }
})

vi.mock('./../../../src/runtime/serverHandler/api/helpers', () => {
  return {
    checkAuth: () => {
      return Promise.resolve()
    },
    getCacheInstance: (event: any) => {
      return event.__MULTI_CACHE.data
    },
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

describe('stats API handler', () => {
  test('Returns stats for a cache.', async () => {
    const storageData = createStorage()
    storageData.setItem('myKey', 'This is the data.')
    storageData.setItem('anotherKey', 'Other data.')

    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          data: storageData,
        },
        serverOptions: {
          api: {
            authorization: () => {
              return Promise.resolve(true)
            },
          },
        },
        config: {
          api: {},
        },
      },
    })

    const result = await stats({
      context: {
        params: {
          cacheName: 'data',
        },
      },
    } as any)
    expect(result).toMatchInlineSnapshot(`
      {
        "rows": [
          {
            "data": "This is the data.",
            "key": "myKey",
          },
          {
            "data": "Other data.",
            "key": "anotherKey",
          },
        ],
        "status": "OK",
        "total": 2,
      }
    `)
  })
})
