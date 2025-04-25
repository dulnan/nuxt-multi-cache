import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest'
import { useDataCache } from './../../src/runtime/composables'
import type { CacheItem } from './../../src/runtime/types'
import type { H3Event } from 'h3'

function buildEvent(): H3Event {
  const storage: Record<string, CacheItem> = {
    foobar: { data: 'Cached data.' },
    expires: {
      data: 'Data with expiration date.',
      expires: 1669849200,
    },
  }
  return {
    __MULTI_CACHE: {
      data: {
        storage: {
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
  } as H3Event
}

vi.mock('#imports', () => {
  return {
    useRequestEvent: () => {
      return undefined
    },
    useRuntimeConfig: () => {
      return {
        multiCache: {
          data: true,
        },
      }
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
    const cache = await useDataCache('foobar', buildEvent())

    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()

    expect(await cache.addToCache('asdf')).toBeUndefined()
  })

  test('Returns cached data in server', async () => {
    import.meta.env.VITEST_SERVER = 'true'
    const event = buildEvent()

    expect((await useDataCache('foobar', event)).value).toEqual('Cached data.')
    expect((await useDataCache('something', event)).value).toBeUndefined()
  })

  test('Does not return expired data.', async () => {
    import.meta.env.VITEST_SERVER = 'true'
    const date = new Date(2023, 11, 1)
    vi.setSystemTime(date)
    const event = buildEvent()

    expect((await useDataCache('expires', event)).value).toBeUndefined()
  })

  test('Returns not yet expired data', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const date = new Date(2021, 11, 1)
    vi.setSystemTime(date)

    const event = buildEvent()
    expect((await useDataCache('expires', event)).value).toEqual(
      'Data with expiration date.',
    )
  })

  test('Puts data in cache', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const event = buildEvent()
    const { addToCache, value } = await useDataCache(
      'should_be_in_cache',
      event,
    )
    expect(value).toBeUndefined()
    await addToCache('My data')

    expect((await useDataCache('should_be_in_cache', event)).value).toEqual(
      'My data',
    )
  })

  test('Puts data in cache with cache tags', async () => {
    import.meta.env.VITEST_SERVER = 'true'
    const event = buildEvent()

    const { addToCache, value } = await useDataCache('data_with_tags', event)
    expect(value).toBeUndefined()
    await addToCache('Hello', ['my_tag'])

    expect((await useDataCache('data_with_tags', event)).value).toEqual('Hello')
    expect((await useDataCache('data_with_tags', event)).cacheTags).toEqual([
      'my_tag',
    ])
  })

  test('Puts data in cache with expiration value', async () => {
    import.meta.env.VITEST_SERVER = 'true'
    const date = new Date(2021, 11, 1)
    vi.setSystemTime(date)
    const event = buildEvent()

    const { addToCache, value } = await useDataCache('data_with_expires', event)
    expect(value).toBeUndefined()
    await addToCache('Hello', ['my_tag'], 1800)

    expect((await useDataCache('data_with_expires', event)).value).toEqual(
      'Hello',
    )
    expect(
      (await useDataCache('data_with_expires', event)).expires,
    ).toMatchInlineSnapshot('1638318600')
  })

  test('Returns dummy if SSR context not found', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const cache = await useDataCache('foobar', {} as H3Event)
    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()
  })

  test('Returns dummy if data cache not enabled.', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const cache = await useDataCache('foobar', {
      __MULTI_CACHE: {
        data: undefined,
      },
    } as H3Event)
    expect(cache.value).toBeFalsy()
  })

  test('Uses provided event to get data cache.', async () => {
    import.meta.env.VITEST_SERVER = 'true'
    const storage: Record<string, CacheItem> = {
      foobar: { data: 'More cached data.' },
    }
    const event = {
      __MULTI_CACHE: {
        data: {
          storage: {
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
})
