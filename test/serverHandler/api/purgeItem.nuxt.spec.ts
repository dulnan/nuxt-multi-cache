import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import purgeItem from './../../../src/runtime/serverHandler/api/purgeItem'

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

describe('purgeItem API handler', () => {
  test('Purges a single item', async () => {
    const storageData = createStorage()

    const event: any = {
      context: {
        __MULTI_CACHE: {
          data: storageData,
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
      context: {
        __MULTI_CACHE: {
          data: storageData,
        },
      },
    }
    expect(purgeItem(event)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: No valid keys provided.]`,
    )
  })
})
