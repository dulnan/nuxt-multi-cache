import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createStorage } from 'unstorage'
import { sleep } from '../../__helpers__'
import { encodeComponentCacheItem } from '../../../src/runtime/helpers/cacheItem'
import purgeTags, {
  DebouncedInvalidator,
} from './../../../src/runtime/server/api/purgeTags'

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
  }
})

vi.mock('#multi-cache-server-options', () => {
  return {
    serverOptions: {},
  }
})

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        api: {
          cacheTagInvalidationDelay: 1000,
        },
      },
    }
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
    await storageComponent.setItemRaw(
      'component1',
      encodeComponentCacheItem('This is the data.'),
    )
    await storageComponent.setItemRaw(
      'component2',
      encodeComponentCacheItem('Other data.', {}, undefined, ['one']),
    )

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
          api: {
            cacheTagInvalidationDelay: 800,
          },
        },
      },
    })

    const event: any = {
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

  test('Throws error if no tags are provided', async () => {
    const storage = createStorage()

    await expect(
      purgeTags({
        __MULTI_CACHE: {
          data: { storage },
        },
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: No valid tags provided.]`,
    )

    await expect(
      purgeTags({
        __MULTI_CACHE: {
          data: { storage },
        },
        body: 'Invalid body',
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: No valid tags provided.]`,
    )
  })
})

describe('DebouncedInvalidator', () => {
  test('Returns if cache context is not available.', async () => {
    const invalidator = new DebouncedInvalidator()
    const result = await invalidator.invalidate()
    expect(result).toBeUndefined()
  })
})
