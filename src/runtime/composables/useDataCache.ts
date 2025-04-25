import type { H3Event } from 'h3'
import { logger } from '../helpers/logger'
import type { CacheItem } from './../types'
import {
  getExpiresValue,
  getMultiCacheContext,
  getCacheKeyWithPrefix,
  isExpired,
} from './../helpers/server'
import { useRuntimeConfig, useNuxtApp } from '#imports'

type AddToCacheMethod<T> = (
  data: T,
  tags?: string[],
  maxAge?: number,
) => Promise<void>

type CallbackContext<T> = {
  addToCache: AddToCacheMethod<T>
  value?: T
  cacheTags: string[]
  expires?: number
}

export async function useDataCache<T>(
  key: string,
  providedEvent?: H3Event,
): Promise<CallbackContext<T>> {
  // Dummy argument for the callback used when something goes wrong accessing
  // the cache or on client side.
  const dummy: CallbackContext<T> = {
    addToCache: (_v: T) => {
      return Promise.resolve()
    },
    cacheTags: [] as string[],
  }

  const isServer =
    import.meta.env.VITEST_SERVER === 'true' || import.meta.server

  // Code only available on server side.
  if (!isServer) {
    return dummy
  }
  const { debug } = useRuntimeConfig().multiCache || {}

  const event = providedEvent || useNuxtApp().ssrContext?.event

  if (!event) {
    if (debug) {
      logger.warn(
        'No H3Event provided while not in vue context when calling useDataCache for key: ' +
          key,
      )
    }

    return dummy
  }

  const multiCache = getMultiCacheContext(event)
  // Get the cache storage. If the module is disabled this will be
  // undefined.
  if (!multiCache?.data) {
    return dummy
  }

  const bubbleError = multiCache.data.bubbleError

  // Try to get the item from cache.
  const fullKey = getCacheKeyWithPrefix(key, event)

  const item = await multiCache.data.storage
    .getItem<CacheItem>(fullKey)
    .catch((e) => {
      if (bubbleError) {
        throw e
      }
    })

  const addToCache: AddToCacheMethod<T> = (
    data: T,
    cacheTags: string[] = [],
    maxAge?: number,
  ) => {
    const item: CacheItem = { data: data as any, cacheTags }
    if (maxAge) {
      item.expires = getExpiresValue(maxAge)
    }
    if (debug) {
      logger.info('Stored item in data cache: ' + fullKey)
    }

    return multiCache
      .data!.storage.setItem(fullKey, item, { ttl: maxAge })
      .catch((e) => {
        if (bubbleError) {
          throw e
        }
      })
  }

  if (item) {
    const itemIsExpired = isExpired(item)
    if (!itemIsExpired) {
      if (debug) {
        logger.info('Returned item from data cache: ' + fullKey)
      }

      return {
        addToCache,
        // Extract the value. If the item was stored along its cache tags, it
        // will be an object with a cacheTags property.
        value: item.data as T,
        cacheTags: item.cacheTags || [],
        expires: item.expires,
      }
    } else if (debug) {
      logger.info(
        'Skipped returning item from data cache because expired: ' + fullKey,
      )
    }
  }

  return {
    addToCache,
    cacheTags: [],
  }
}
