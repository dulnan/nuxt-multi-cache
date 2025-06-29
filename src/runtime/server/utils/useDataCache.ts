import type { H3Event } from 'h3'
import type {
  DataCacheAddToCacheMethod,
  DataCacheCallbackContext,
  CacheItem,
} from '../../types'
import {
  enabledForRequest,
  getCacheKeyWithPrefix,
  getExpiresValue,
  getMultiCacheContext,
  isExpired,
} from '../../helpers/server'
import { logger } from '../../helpers/logger'
import { debug } from '#nuxt-multi-cache/config'
import {
  CACHE_NEVER,
  CACHE_PERMANENT,
  type MaxAge,
  parseMaxAge,
} from '../../helpers/maxAge'

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

  const isEnabled = await enabledForRequest(event)
  if (!isEnabled) {
    return dummy
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
    providedMaxAge?: MaxAge,
  ) => {
    const item: CacheItem = { data: data as any, cacheTags }
    const maxAge =
      providedMaxAge !== undefined ? parseMaxAge(providedMaxAge) : null

    if (maxAge === CACHE_NEVER) {
      return Promise.resolve()
    }

    if (maxAge !== CACHE_PERMANENT && typeof maxAge === 'number') {
      item.expires = getExpiresValue(maxAge)
    }

    if (debug) {
      logger.info('Stored item in data cache: ' + fullKey)
    }

    try {
      return multiCache.data!.storage.setItem(fullKey, item, {
        ttl: maxAge !== CACHE_PERMANENT ? maxAge : undefined,
      })
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
