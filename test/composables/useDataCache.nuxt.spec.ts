import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useDataCache } from './../../src/runtime/composables'
import type { CacheItem } from './../../src/runtime/types'

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        data: true,
      },
    }
  }
})

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  const storage: Record<string, CacheItem> = {
    foobar: { data: 'Cached data.' },
    expires: {
      data: 'Data with expiration date.',
      expires: 1669849200,
    },
  }
  return {
    // @ts-ignore
    ...actual,
    useSSRContext: () => {
      return {
        event: {
          context: {
            __MULTI_CACHE: {
              data: {
                getItem: (key: string) => {
                  return Promise.resolve(storage[key])
                },
                setItem: (key: string, data: any) => {
                  storage[key] = data
                  return Promise.resolve()
                },
              },
            },
          },
        },
      }
    },
    getCurrentInstance: () => {
      return true
    },
  }
})

describe('useDataCache composable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  test('Returns dummy in client', async () => {
    process.client = true
    const cache = await useDataCache('foobar')

    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()

    expect(await cache.addToCache('asdf')).toBeUndefined()
  })

  test('Returns cached data in server', async () => {
    process.client = false

    expect((await useDataCache('foobar')).value).toEqual('Cached data.')
    expect((await useDataCache('something')).value).toBeUndefined()
  })

  test('Does not return expired data.', async () => {
    process.client = false
    const date = new Date(2023, 11, 1)
    vi.setSystemTime(date)

    expect((await useDataCache('expires')).value).toBeUndefined()
  })

  test('Returns not yet expired data', async () => {
    process.client = false

    const date = new Date(2021, 11, 1)
    vi.setSystemTime(date)

    expect((await useDataCache('expires')).value).toEqual(
      'Data with expiration date.',
    )
  })

  test('Puts data in cache', async () => {
    process.client = false

    const { addToCache, value } = await useDataCache('should_be_in_cache')
    expect(value).toBeUndefined()
    await addToCache('My data')

    expect((await useDataCache('should_be_in_cache')).value).toEqual('My data')
  })

  test('Puts data in cache with cache tags', async () => {
    process.client = false

    const { addToCache, value } = await useDataCache('data_with_tags')
    expect(value).toBeUndefined()
    await addToCache('Hello', ['my_tag'])

    expect((await useDataCache('data_with_tags')).value).toEqual('Hello')
    expect((await useDataCache('data_with_tags')).cacheTags).toEqual(['my_tag'])
  })

  test('Puts data in cache with expiration value', async () => {
    process.client = false
    const date = new Date(2021, 11, 1)
    vi.setSystemTime(date)

    const { addToCache, value } = await useDataCache('data_with_expires')
    expect(value).toBeUndefined()
    await addToCache('Hello', ['my_tag'], 1800)

    expect((await useDataCache('data_with_expires')).value).toEqual('Hello')
    expect(
      (await useDataCache('data_with_expires')).expires,
    ).toMatchInlineSnapshot('1638318600')
  })

  test('Returns dummy if SSR context not found', async () => {
    process.client = false

    const vue = await import('vue')
    vue.useSSRContext = vi.fn().mockReturnValueOnce({})

    const cache = await useDataCache('foobar')
    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()
  })

  test('Returns dummy if data cache not enabled.', async () => {
    process.client = false

    const vue = await import('vue')
    vue.useSSRContext = vi.fn().mockReturnValueOnce({})

    const cache = await useDataCache('foobar')
    expect(cache.value).toBeFalsy()
  })

  test('Uses provided event to get data cache.', async () => {
    process.client = false
    const storage: Record<string, CacheItem> = {
      foobar: { data: 'More cached data.' },
    }
    const event = {
      context: {
        __MULTI_CACHE: {
          data: {
            getItem: (key: string) => {
              return Promise.resolve(storage[key])
            },
            setItem: (key: string, data: any) => {
              storage[key] = data
              return Promise.resolve()
            },
          },
        },
      },
    }

    const cache = await useDataCache('foobar', event as any)
    expect(cache.value).toEqual('More cached data.')
  })

  test('Catches errors and logs them.', async () => {
    process.client = false
    const consoleSpy = vi.spyOn(global.console, 'debug')

    const event = {
      context: {
        __MULTI_CACHE: {
          data: {
            getItem: () => {
              throw new Error('Failed to get item from cache.')
            },
          },
        },
      },
    }

    const cache = await useDataCache('foobar', event as any)
    expect(cache.value).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith('Failed to get item from cache.')
  })
})
