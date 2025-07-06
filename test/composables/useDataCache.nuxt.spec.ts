import type { H3Event } from 'h3'
import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest'
import { useDataCache } from './../../src/runtime/composables/useDataCache'
import type { CacheItem } from './../../src/runtime/types'
import { MULTI_CACHE_CONTEXT_KEY } from '~/src/runtime/helpers/server'

const { getIsServer, setIsServer } = vi.hoisted(() => {
  let serverValue = false

  return {
    getIsServer: vi.fn(() => serverValue),
    setIsServer: (value: boolean) => {
      serverValue = value
    },
  }
})

// Use the hoisted function in the mock
vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return getIsServer()
    },
    debug: false,
    cdnEnabled: true,
  }
})

function buildEventWithStorage(storage: Record<string, CacheItem>): H3Event {
  return {
    context: {
      [MULTI_CACHE_CONTEXT_KEY]: {
        cache: {
          data: {
            storage: {
              getItem: (key: string) => {
                if (key === 'force_get_error') {
                  throw new Error('Failed to get data cache item.')
                }
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
    },
  } as H3Event
}

function buildEvent(bubbleError = false): H3Event {
  const storage: Record<string, CacheItem> = {
    foobar: {
      data: 'Cached data.',
      expires: -1,
      staleIfErrorExpires: 0,
    },
    expires: {
      data: 'Data with expiration date.',
      expires: 1669849200,
      staleIfErrorExpires: 0,
    },
  }

  return {
    context: {
      [MULTI_CACHE_CONTEXT_KEY]: {
        cache: {
          data: {
            bubbleError,
            storage: {
              getItem: (key: string) => {
                if (key === 'force_get_error') {
                  throw new Error('Failed to get data cache item.')
                }
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
    setIsServer(false)
    const cache = await useDataCache('foobar', buildEvent())

    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()

    expect(await cache.addToCache('asdf')).toBeUndefined()
  })

  test('Returns cached data in server', async () => {
    setIsServer(true)
    const event = buildEvent()

    expect((await useDataCache('foobar', event)).value).toEqual('Cached data.')
    expect((await useDataCache('something', event)).value).toBeUndefined()
  })

  test('Does not return expired data.', async () => {
    setIsServer(true)
    const date = new Date(2023, 11, 1)
    vi.setSystemTime(date)
    const event = buildEvent()

    expect((await useDataCache('expires', event)).value).toBeUndefined()
  })

  test('Returns not yet expired data', async () => {
    setIsServer(true)

    const date = new Date(2021, 11, 1)
    vi.setSystemTime(date)

    const event = buildEvent()
    expect((await useDataCache('expires', event)).value).toEqual(
      'Data with expiration date.',
    )
  })

  test('Puts data in cache', async () => {
    setIsServer(true)

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
    setIsServer(true)
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
    setIsServer(true)
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
    setIsServer(true)

    const cache = await useDataCache('foobar', {} as H3Event)
    expect(cache.value).toBeFalsy()
    expect(cache.addToCache).toBeDefined()
  })

  test('Returns dummy if data cache not enabled.', async () => {
    setIsServer(true)

    const cache = await useDataCache('foobar', {
      context: {
        multiCacheApp: {
          cache: {
            data: undefined,
          },
        },
      },
    } as H3Event)
    expect(cache.value).toBeFalsy()
  })

  test('Uses provided event to get data cache.', async () => {
    setIsServer(true)
    const storage: Record<string, CacheItem> = {
      foobar: {
        data: 'More cached data.',
        expires: -1,
        staleIfErrorExpires: 0,
      },
    }
    const event = {
      context: {
        [MULTI_CACHE_CONTEXT_KEY]: {
          cache: {
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
        },
      },
    } as H3Event

    const cache = await useDataCache('foobar', event)
    expect(cache.value).toEqual('More cached data.')
  })

  test('Returns staleValue if permanent stale age value', async () => {
    setIsServer(true)
    const event = buildEventWithStorage({
      foobar: {
        data: 'More cached data.',
        expires: -1,
        staleIfErrorExpires: -1,
      },
    })

    const cache = await useDataCache('foobar', event)
    expect(cache.value).toEqual('More cached data.')
    expect(cache.staleValue).toEqual('More cached data.')
  })

  test('Does not return staleValue if not specified', async () => {
    setIsServer(true)
    const event = buildEventWithStorage({
      foobar: {
        data: 'More cached data.',
        expires: -1,
        staleIfErrorExpires: 0,
      },
    })

    const cache = await useDataCache('foobar', event)
    expect(cache.value).toEqual('More cached data.')
    expect(cache.staleValue).toBeUndefined()
  })

  test('Returns staleValue if not yet expired', async () => {
    setIsServer(true)
    const date = new Date(2023, 11, 1, 12, 0, 0)
    vi.setSystemTime(date)
    const expireTime = Math.round(
      new Date(2023, 11, 1, 12, 0, 1).getTime() / 1000,
    )
    const event = buildEventWithStorage({
      foobar: {
        data: 'More cached data.',
        expires: -1,
        staleIfErrorExpires: expireTime,
      },
    })

    const cache = await useDataCache('foobar', event)
    expect(cache.value).toEqual('More cached data.')
    expect(cache.staleValue).toEqual('More cached data.')
  })

  test('Does not return staleValue if expired', async () => {
    setIsServer(true)
    const date = new Date(2023, 11, 1, 12, 0, 0)
    vi.setSystemTime(date)
    const expireTime = Math.round(
      new Date(2023, 11, 1, 11, 59, 59).getTime() / 1000,
    )
    const event = buildEventWithStorage({
      foobar: {
        data: 'More cached data.',
        expires: -1,
        staleIfErrorExpires: expireTime,
      },
    })

    const cache = await useDataCache('foobar', event)
    expect(cache.value).toEqual('More cached data.')
    expect(cache.staleValue).toBeUndefined()
  })

  test('Bubbles errors when bubbleError === true', async () => {
    setIsServer(true)
    const event = buildEvent(true)

    await expect(() =>
      useDataCache('force_get_error', event),
    ).rejects.toMatchInlineSnapshot(`[Error: Failed to get data cache item.]`)
  })

  test('Does not bubble errors when bubbleError === false', async () => {
    setIsServer(true)
    expect(
      (await useDataCache('force_get_error', buildEvent(false))).value,
    ).toBeUndefined()
  })
})
