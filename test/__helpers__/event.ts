import type { H3Event } from 'h3'
import type { CacheItem } from '~/src/runtime/types'
import { MULTI_CACHE_CONTEXT_KEY } from '~/src/runtime/helpers/server'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '~/src/runtime/helpers/constants'

export function buildEventWithStorage(
  storage: Record<string, CacheItem>,
  date?: Date,
): H3Event {
  return {
    node: {
      req: {
        headers: {
          [TEST_MODE_DATE_OVERRIDE_HEADER]: date
            ? date.toISOString()
            : undefined,
        } as any,
      },
    },
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
        config: {
          data: true,
        },
      },
    },
  } as H3Event
}

export function buildEvent(bubbleError = false, date?: Date): H3Event {
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
    node: {
      req: {
        headers: {
          [TEST_MODE_DATE_OVERRIDE_HEADER]: date
            ? date.toISOString()
            : undefined,
        } as any,
      },
    },
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
        config: {
          data: true,
        },
      },
    },
  } as H3Event
}
