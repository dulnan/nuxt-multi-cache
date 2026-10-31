import type { H3Event } from 'h3'
import type {
  DataCacheAddToCacheMethod,
  DataCacheCallbackContext,
  DataCacheItem,
  BubbleCacheability,
} from './../types'
import {
  enabledForRequest,
  getCacheKeyWithPrefix,
  isValidCacheKey,
  getCacheTagRegistry,
  getMultiCacheContext,
  getRequestTimestamp,
} from './../helpers/server'
import { logger } from './../helpers/multi-cache-logger'
import { debug } from '#nuxt-multi-cache/config'
import {
  CACHE_NEVER,
  CACHE_PERMANENT,
  getStorageTtl,
  isExpired,
  type MaxAge,
} from './../helpers/maxAge'
import { DataCacheHelper } from './../helpers/DataCacheHelper'
import { bubbleCacheability } from './../helpers/bubbleCacheability'

export type UseDataCacheOptions = {
  /**
   * If set, the cacheability of this data cache item will bubble to other
   * caches.
   */
  bubbleCacheability?: BubbleCacheability
}

export async function useDataCacheImplementation<T>(
  key: string,
  event: H3Event,
  options?: UseDataCacheOptions | null,
): Promise<DataCacheCallbackContext<T>> {
  const dummy: DataCacheCallbackContext<T> = {
    addToCache: (_v: T) => {
      return Promise.resolve()
    },
    cacheTags: [] as string[],
  }

  if (!event.context?.multiCacheApp?.config?.data) {
    return dummy
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
  if (!isValidCacheKey(fullKey, 'data')) {
    return dummy
  }

  const now = getRequestTimestamp(event)
  const addToCache: DataCacheAddToCacheMethod<T> = async (
    data: T,
    providedCacheTags: string[] = [],
    providedMaxAge?: MaxAge,
    providedStaleIfError?: MaxAge,
  ) => {
    const helper = new DataCacheHelper(now)

    // 0 is a valid value and means "never".
    if (providedMaxAge !== undefined && providedMaxAge !== null) {
      helper.setMaxAge(providedMaxAge)
    }

    if (providedStaleIfError !== undefined && providedStaleIfError !== null) {
      helper.setStaleIfError(providedStaleIfError)
    }

    helper.addTags(providedCacheTags)

    bubbleCacheability(helper, event, options?.bubbleCacheability)

    const cacheTags = helper.getTags()

    const item: DataCacheItem<T> = {
      data,
      cacheTags,
      expires: helper.getExpires('maxAge') ?? CACHE_PERMANENT,
      staleIfErrorExpires: helper.getExpires('staleIfError') ?? CACHE_NEVER,
    }

    const ttl = getStorageTtl(item, now)

    // The item can never be returned, not even as a stale value (e.g. a max
    // age of 0 without stale-if-error).
    if (ttl === CACHE_NEVER) {
      return
    }

    if (debug) {
      logger.info('Stored item in data cache: ' + fullKey)
    }

    try {
      await multiCache.data!.storage.setItem(fullKey, item, { ttl })
      if (cacheTags.length) {
        const registry = getCacheTagRegistry(event)
        if (registry) {
          await registry.addCacheTags(fullKey, 'data', cacheTags)
        }
      }
    } catch (e) {
      logger.error('Failed to store data cache item.', e)
      if (bubbleError) {
        throw e
      }
    }
  }

  try {
    const item =
      await multiCache.data.storage.getItem<DataCacheItem<T>>(fullKey)

    const staleValue =
      item &&
      item.staleIfErrorExpires &&
      !isExpired(item.staleIfErrorExpires, now)
        ? item.data
        : undefined

    if (item) {
      const itemIsExpired = isExpired(item.expires, now)
      if (!itemIsExpired) {
        if (debug) {
          logger.info('Returned item from data cache: ' + fullKey)
        }

        bubbleCacheability(item, event, options?.bubbleCacheability)

        return {
          addToCache,
          // Extract the value. If the item was stored along its cache tags, it
          // will be an object with a cacheTags property.
          value: item.data,
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
