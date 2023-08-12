import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import { sleep } from '../../__helpers__'
import purgeTags, {
  DebouncedInvalidator,
} from './../../../src/runtime/serverHandler/api/purgeTags'

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
  }
})

vi.mock('#multi-cache-server-options', () => {
  return {
    default: {},
  }
})

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {
          api: {
            cacheTagInvalidationDelay: 1000,
          },
        },
      }
    },
  }
})

describe('purgeTags API handler', () => {
  test('Purges cache items by tag', async () => {
    const storageData = createStorage()
    await storageData.setItem('data1', {
      data: 'This is the data.',
      cacheTags: ['one'],
    })
    await storageData.setItem('data2', 'Other data.')

    const storageComponent = createStorage()
    await storageComponent.setItem('component1', 'This is the data.')
    await storageComponent.setItem('component2', {
      markup: 'Other data.',
      cacheTags: ['one'],
    })

    const event: any = {
      context: {
        __MULTI_CACHE: {
          data: storageData,
          component: storageComponent,
        },
      },
      body: ['one'],
    }

    // Purge a single tag.
    const result = await purgeTags(event)

    expect(result).toMatchInlineSnapshot(`
      {
        "status": "OK",
        "tags": [
          "one",
        ],
      }
    `)

    // Items are still in cache because timeout is not over yet.
    expect(await storageData.getItem('data1')).toBeTruthy()
    expect(await storageComponent.getItem('component2')).toBeTruthy()

    // Wait until invalidator timeout is over.
    await sleep(1200)

    // Items are now purged.
    expect(await storageData.getItem('data1')).toBeNull()
    expect(await storageComponent.getItem('component2')).toBeNull()
  })

  test('Throws error if no tags are provided', () => {
    const storageData = createStorage()

    expect(
      purgeTags({
        context: {
          __MULTI_CACHE: {
            data: storageData,
          },
        },
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot('"No valid tags provided."')

    expect(
      purgeTags({
        context: {
          __MULTI_CACHE: {
            data: storageData,
          },
        },
        body: 'Invalid body',
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot('"No valid tags provided."')
  })
})

describe('DebouncedInvalidator', () => {
  test('Returns if cache context is not available.', async () => {
    const invalidator = new DebouncedInvalidator()
    const result = await invalidator.invalidate()
    expect(result).toBeUndefined()
  })
})
