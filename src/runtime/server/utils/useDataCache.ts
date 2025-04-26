import type { H3Event } from 'h3'
import type {
  AddToCacheMethod,
  CallbackContext,
} from '../../types/useDataCache'
import {
  getCacheKeyWithPrefix,
  getExpiresValue,
  getMultiCacheContext,
  isExpired,
} from '../../helpers/server'
import type { CacheItem } from '../../types'
import { logger } from '../../helpers/logger'
import { useRuntimeConfig } from '#imports'

export async function useDataCache<T>(
  key: string,
  event: H3Event,
): Promise<CallbackContext<T>> {
  const { debug } = useRuntimeConfig().multiCache || {}

  const dummy: CallbackContext<T> = {
    addToCache: (_v: T) => {
      return Promise.resolve()
    },
    cacheTags: [] as string[],
  }

  const multiCache = getMultiCacheContext(event)

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
