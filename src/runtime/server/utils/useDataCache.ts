import type { H3Event } from 'h3'
import type {
  DataCacheAddToCacheMethod,
  DataCacheCallbackContext,
  CacheItem,
} from '../../types'
import {
  enabledForRequest,
  getCacheKeyWithPrefix,
  getMultiCacheContext,
  getRequestTimestamp,
} from '../../helpers/server'
import { logger } from '../../helpers/logger'
import { debug } from '#nuxt-multi-cache/config'
import { CACHE_NEVER, CACHE_PERMANENT, type MaxAge } from '../../helpers/maxAge'
import { isExpired } from '../../helpers/maxAge'
import { DataCacheHelper } from '../../helpers/DataCacheHelper'

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

  const now = getRequestTimestamp(event)
  const addToCache: DataCacheAddToCacheMethod<T> = (
    data: T,
    cacheTags: string[] = [],
    providedMaxAge?: MaxAge,
    providedStaleIfError?: MaxAge,
  ) => {
    const helper = new DataCacheHelper(now)
    if (providedMaxAge) {
      helper.setMaxAge(providedMaxAge)
    }
    if (providedStaleIfError) {
      helper.setStaleIfError(providedStaleIfError)
    }

    if (helper.maxAge === CACHE_NEVER) {
      return Promise.resolve()
    }

    const item: CacheItem = {
      data: data as any,
      cacheTags,
      expires: helper.getExpires('maxAge') ?? CACHE_PERMANENT,
      staleIfErrorExpires: helper.getExpires('staleIfError') ?? CACHE_NEVER,
    }

    if (debug) {
      logger.info('Stored item in data cache: ' + fullKey)
    }

    try {
      return multiCache.data!.storage.setItem(fullKey, item, {
        ttl: helper.maxAge !== CACHE_PERMANENT ? helper.maxAge : undefined,
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

    const staleValue =
      item &&
      item.staleIfErrorExpires &&
      !isExpired(item.staleIfErrorExpires, now)
        ? (item.data as T)
        : undefined

    if (item) {
      const itemIsExpired = isExpired(item.expires, now)
      if (!itemIsExpired) {
        if (debug) {
          logger.info('Returned item from data cache: ' + fullKey)
        }

        return {
          addToCache,
          // Extract the value. If the item was stored along its cache tags, it
          // will be an object with a cacheTags property.
          value: item.data as T,
          staleValue,
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
      staleValue,
      cacheTags: item?.cacheTags || [],
      expires: item?.expires,
    }
  } catch (e) {
    logger.error('Failed to load data cache item,', e)
    if (bubbleError) {
      throw e
    }
  }

  return dummy
}
