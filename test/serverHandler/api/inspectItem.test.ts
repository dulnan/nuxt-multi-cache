import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import inspectItem from './../../../src/runtime/serverHandler/api/inspectItem'

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {},
      }
    },
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
      const cache = event.__CACHE_NAME
      return event.context.__MULTI_CACHE[cache]
    },
  }
})

describe('inspectItem API handler', () => {
  test('Returns details for a component cache item.', async () => {
    const storage = createStorage()
    storage.setItem('component1', '<div>Hello world</div>')
    storage.setItem('component2', { markup: '<div>Object OBJECT</div>' })

    expect(
      await inspectItem({
        context: {
          __MULTI_CACHE: {
            component: storage,
          },
          params: {
            cacheName: 'component',
            key: 'component1',
          },
        },
        __CACHE_NAME: 'component',
      } as any),
    ).toMatchInlineSnapshot('"<div>Hello world</div>"')

    expect(
      await inspectItem({
        context: {
          __MULTI_CACHE: {
            component: storage,
          },
          params: {
            cacheName: 'component',
            key: 'component2',
          },
        },
        __CACHE_NAME: 'component',
      } as any),
    ).toMatchInlineSnapshot('"<div>Object OBJECT</div>"')
  })

  test('Returns details for a data cache item.', async () => {
    const storage = createStorage()
    storage.setItem('data1', 'My data')
    storage.setItem('data2', { data: 'My second data' })

    expect(
      await inspectItem({
        context: {
          __MULTI_CACHE: {
            data: storage,
          },
          params: {
            cacheName: 'data',
            key: 'data1',
          },
        },
        __CACHE_NAME: 'data',
      } as any),
    ).toMatchInlineSnapshot('"My data"')

    expect(
      await inspectItem({
        context: {
          __MULTI_CACHE: {
            data: storage,
          },
          params: {
            cacheName: 'data',
            key: 'data2',
          },
        },
        __CACHE_NAME: 'data',
      } as any),
    ).toMatchInlineSnapshot('"My second data"')
  })

  test('Throws 404 if item is not found.', () => {
    expect(
      inspectItem({
        context: {
          __MULTI_CACHE: {
            component: createStorage(),
          },
          params: {
            cacheName: 'component',
            key: 'component2',
          },
        },
        __CACHE_NAME: 'component',
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot('"Cache item does not exist."')
  })
})
