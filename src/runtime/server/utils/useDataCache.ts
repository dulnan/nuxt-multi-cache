import type { H3Event } from 'h3'
import type {
  DataCacheAddToCacheMethod,
  DataCacheCallbackContext,
  CacheItem,
} from '../../types'
import {
  getCacheKeyWithPrefix,
  getExpiresValue,
  getMultiCacheContext,
  isExpired,
} from '../../helpers/server'
import { logger } from '../../helpers/logger'
import { debug } from '#nuxt-multi-cache/config'

export async function useDataCache<T>(
  key: string,
  event: H3Event,
): Promise<DataCacheCallbackContext<T>> {
  const dummy: DataCacheCallbackContext<T> = {
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

  const fullKey = await getCacheKeyWithPrefix(key, event)

  const addToCache: DataCacheAddToCacheMethod<T> = (
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

    try {
      return multiCache.data!.storage.setItem(fullKey, item, { ttl: maxAge })
    } catch (e) {
      logger.error('Failed to store data cache item.', e)
      if (bubbleError) {
        throw e
      }
    }

    return Promise.resolve()
  }

  try {
    const item = await multiCache.data.storage.getItem<CacheItem>(fullKey)

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
  } catch (e) {
    logger.error('Failed to load data cache item,', e)
    if (bubbleError) {
      throw e
    }
  }

  return dummy
}
