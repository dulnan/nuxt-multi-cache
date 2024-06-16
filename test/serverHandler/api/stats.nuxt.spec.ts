import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import stats from './../../../src/runtime/serverHandler/api/stats'

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
      return event.context.__MULTI_CACHE.data
    },
  }
})

describe('stats API handler', () => {
  test('Returns stats for a cache.', async () => {
    const storageData = createStorage()
    storageData.setItem('myKey', 'This is the data.')
    storageData.setItem('anotherKey', 'Other data.')

    const event: any = {
      context: {
        __MULTI_CACHE: {
          data: storageData,
        },
      },
    }
    const result = await stats(event)
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
