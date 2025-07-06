import type { H3Event } from 'h3'
import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest'
import { useDataCacheCallback } from './../../src/runtime/composables/useDataCacheCallback'
import { useDataCache } from './../../src/runtime/composables/useDataCache'
import type { CacheItem } from './../../src/runtime/types'
import { MULTI_CACHE_CONTEXT_KEY } from '~/src/runtime/helpers/server'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

let isServerValue = false

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return isServerValue
    },
    debug: false,
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
    foobar: { data: 'Cached data.', expires: -1, staleIfErrorExpires: 0 },
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

describe('useDataCacheCallback composable', () => {
  beforeEach(() => {
    isServerValue = false
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  test('always executes callback on client', async () => {
    async function getValue() {
      return await useDataCacheCallback(
        'foobar',
        () => {
          return {
            value: Math.floor(Math.random() * 1000000000),
          }
        },
        buildEvent(),
      )
    }

    const first = await getValue()
    const second = await getValue()

    expect(first).to.not.equal(second)
  })

  test('Returns cached data in server', async () => {
    isServerValue = true
    async function getValue() {
      return await useDataCacheCallback(
        'foobar',
        () => {
          return {
            value: Date.now(),
          }
        },
        buildEvent(),
      )
    }

    const first = await getValue()
    const second = await getValue()

    expect(first).toEqual(second)
  })

  test('Returns data not yet expired', async () => {
    isServerValue = true
    const date = new Date(2010, 11, 1)
    vi.setSystemTime(date)

    const result = await useDataCacheCallback(
      'expires',
      () => {
        return {
          value: 'New value',
        }
      },
      buildEvent(),
    )

    expect(result).toEqual('Data with expiration date.')
  })

  test('Does not return expired data.', async () => {
    isServerValue = true
    const date = new Date(2023, 11, 1)
    vi.setSystemTime(date)

    const result = await useDataCacheCallback(
      'expires',
      () => {
        return {
          value: 'New value',
        }
      },
      buildEvent(),
    )

    expect(result.value).toEqual('New value')
  })

  test('Puts data in cache with cache tags', async () => {
    isServerValue = true
    const event = buildEvent()

    await useDataCacheCallback(
      'callback_data_with_tags',
      (helper) => {
        helper?.addTags(['one', 'two', 'three'])
        return 'Foobar'
      },
      event,
    )

    expect(
      (await useDataCache('callback_data_with_tags', event)).cacheTags,
    ).toEqual(['one', 'two', 'three'])
  })

  test('Puts data in cache with expiration value', async () => {
    isServerValue = true
    const date = new Date(2021, 11, 1)
    vi.setSystemTime(date)
    const event = buildEvent()

    await useDataCacheCallback(
      'data_with_expires',
      (helper) => {
        helper?.setMaxAge(1800)
        return 'Foobar'
      },
      event,
    )

    expect((await useDataCache('data_with_expires', event)).value).toEqual(
      'Foobar',
    )
    expect(
      (await useDataCache('data_with_expires', event)).expires,
    ).toMatchInlineSnapshot('1638318600')
  })

  test('Returns stale data if permanent age defined', async () => {
    isServerValue = true
    const event = buildEventWithStorage({
      foobar: {
        data: 'Some stale data.',
        expires: -1,
        staleIfErrorExpires: -1,
      },
    })

    const data = await useDataCacheCallback(
      'foobar',
      () => {
        throw new Error('Error loading data')
      },
      event,
    )

    expect(data).toEqual('Some stale data.')
  })

  test('Returns stale data if staleIfError not yet expired', async () => {
    isServerValue = true
    const date = new Date(2015, 5, 6, 12, 0, 0, 0)
    vi.setSystemTime(date)
    const expires = toTimestamp(new Date(2015, 5, 6, 11, 59, 59, 0))

    const staleIfErrorExpires = toTimestamp(new Date(2015, 5, 6, 12, 0, 1, 0))
    const event = buildEventWithStorage({
      foobar: {
        data: 'Some stale data.',
        expires,
        staleIfErrorExpires,
      },
    })

    const data = await useDataCacheCallback(
      'foobar',
      () => {
        throw new Error('Error loading data')
      },
      event,
    )

    expect(data).toEqual('Some stale data.')
  })

  test('Throws an error if no staleIfError is defined', async () => {
    isServerValue = true
    const date = new Date(2015, 5, 6, 12, 0, 0, 0)
    vi.setSystemTime(date)
    const expires = toTimestamp(new Date(2015, 5, 6, 11, 59, 59, 0))
    const event = buildEventWithStorage({
      foobar: {
        data: 'Some stale data.',
        expires,
        staleIfErrorExpires: 0,
      },
    })

    await expect(() =>
      useDataCacheCallback(
        'foobar',
        () => {
          throw new Error('Error loading data')
        },
        event,
      ),
    ).rejects.toThrowError('Error loading data')
  })

  test('Throws an error if staleIfError is expired', async () => {
    isServerValue = true
    const date = new Date(2015, 5, 6, 12, 0, 0, 0)
    vi.setSystemTime(date)
    const expires = toTimestamp(new Date(2015, 5, 6, 11, 59, 59, 0))

    const staleIfErrorExpires = toTimestamp(new Date(2015, 5, 6, 11, 59, 59, 0))
    const event = buildEventWithStorage({
      foobar: {
        data: 'Some stale data.',
        expires,
        staleIfErrorExpires,
      },
    })

    await expect(() =>
      useDataCacheCallback(
        'foobar',
        () => {
          throw new Error('Error loading data')
        },
        event,
      ),
    ).rejects.toThrowError('Error loading data')
  })
})
