import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import { sleep } from '../../__helpers__'
import { encodeComponentCacheItem } from '../../../src/runtime/helpers/cacheItem'
import purgeTags from './../../../src/runtime/server/api/purgeTags'
import type { MultiCacheInstances } from '~/src/runtime/types'
import { CacheTagInvalidator } from '~/src/runtime/helpers/CacheTagInvalidator'

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

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: {},
  }
})

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    cacheTagInvalidationDelay: 1000,
    isTestMode: true,
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

    const cacheContext: MultiCacheInstances = {
      data: { storage: storageData, bubbleError: false },
      component: { storage: storageComponent, bubbleError: false },
    }

    const cacheTagInvalidator = new CacheTagInvalidator(cacheContext, null)

    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        cache: cacheContext,
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
        cacheTagInvalidator,
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
        context: {
          multiCacheApp: {
            cache: {
              data: { storage },
            },
          },
        },
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: No valid tags provided.]`,
    )

    await expect(
      purgeTags({
        context: {
          multiCacheApp: {
            cache: {
              data: { storage },
            },
          },
        },
        body: 'Invalid body',
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: No valid tags provided.]`,
    )
  })
})
