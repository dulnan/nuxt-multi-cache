import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import purgeAll from './../../../src/runtime/serverHandler/api/purgeAll'

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {},
      }
    },
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
    const event: any = {
      context: {},
    }
    const result = await purgeAll(event)

    expect(result).toBeUndefined()
  })
  test('Purges all cache entries', async () => {
    const storageComponent = createStorage()
    const storageData = createStorage()

    const event: any = {
      context: {
        __MULTI_CACHE: {
          component: storageComponent,
          data: storageData,
        },
        __MULTI_CACHE_ROUTE: {
          tags: [],
          cacheable: null,
          control: {},
        },
      },
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
