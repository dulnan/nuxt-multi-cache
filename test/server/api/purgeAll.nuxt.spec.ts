import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import purgeAll from './../../../src/runtime/server/api/purgeAll'

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

vi.mock('./../../../src/runtime/serverHandler/api/helpers', () => {
  return {
    checkAuth: () => {
      return Promise.resolve()
    },
  }
})

describe('/api/purge/all', () => {
  test('Returns if cache context is not available', async () => {
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: null,
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
      context: {},
    }
    const result = await purgeAll(event)

    expect(result).toBeUndefined()
    mocks.useNitroApp.mockRestore()
  })

  test('Purges all cache entries', async () => {
    const storageComponent = createStorage()
    const storageData = createStorage()

    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: {
          data: { storage: storageData },
          component: { storage: storageComponent },
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
      context: {},
    }
    const spyClearComponent = vi.spyOn(storageComponent, 'clear')
    const spyClearData = vi.spyOn(storageData, 'clear')
    const result = await purgeAll(event)

    expect(result).toMatchInlineSnapshot(`
      {
        "status": "OK",
      }
    `)
    expect(spyClearComponent).toHaveBeenCalledOnce()
    expect(spyClearData).toHaveBeenCalledOnce()
  })
})
