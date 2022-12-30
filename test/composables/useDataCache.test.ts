import { describe, expect, test, vi } from 'vitest'
import { useDataCache } from './../../src/runtime/composables'

vi.mock('vue', () => {
  const storage: Record<string, any> = {
    foobar: 'Cached data.',
  }
  return {
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
  }
})

describe('useDataCache composable', () => {
  test('Returns dummy in client', async () => {
    const cache = await useDataCache('foobar')

    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()

    expect(await cache.addToCache('asdf')).toBeUndefined()
  })

  test('Returns cached data in server', async () => {
    process.server = true

    expect((await useDataCache('foobar')).value).toEqual('Cached data.')
    expect((await useDataCache('something')).value).toBeUndefined()
  })

  test('Puts data in cache', async () => {
    process.server = true

    const { addToCache, value } = await useDataCache('should_be_in_cache')
    expect(value).toBeUndefined()
    await addToCache('My data')

    expect((await useDataCache('should_be_in_cache')).value).toEqual('My data')
  })

  test('Puts data in cache with cache tags', async () => {
    process.server = true

    const { addToCache, value } = await useDataCache('data_with_tags')
    expect(value).toBeUndefined()
    await addToCache('Hello', ['my_tag'])

    expect((await useDataCache('data_with_tags')).value).toEqual('Hello')
    expect((await useDataCache('data_with_tags')).cacheTags).toEqual(['my_tag'])
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
    process.server = true
    const storage: Record<string, any> = {
      foobar: 'More cached data.',
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
    process.server = true
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
