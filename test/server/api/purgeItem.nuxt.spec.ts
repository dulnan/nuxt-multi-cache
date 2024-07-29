import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import purgeItem from './../../../src/runtime/server/api/purgeItem'

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

describe('purgeItem API handler', () => {
  test('Purges a single item', async () => {
    const storageData = createStorage()

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

    const event: any = {
      context: {
        params: {
          cacheName: 'data',
        },
      },
      body: ['my_key', 'another_key'],
    }
    const spyClearData = vi.spyOn(storageData, 'removeItem')
    const result = await purgeItem(event)

    expect(result).toMatchInlineSnapshot(`
      {
        "affectedKeys": [
          "my_key",
          "another_key",
        ],
        "status": "OK",
      }
    `)
    expect(spyClearData).toHaveBeenCalledTimes(2)
  })

  test('Throws error if no keys are provided', () => {
    const storageData = createStorage()

    const event: any = {
      __MULTI_CACHE: {
        data: storageData,
      },
    }
    expect(purgeItem(event)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: No valid keys provided.]`,
    )
  })
})
