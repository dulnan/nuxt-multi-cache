import { type H3Event } from 'h3'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import {
  encodeRouteCacheKey,
  getCacheKeyWithPrefix,
  getMultiCacheContext,
} from '../../helpers/server'
import {
  decodeRouteCacheItem,
  handleRawCacheData,
} from '../../helpers/cacheItem'
import { RouteCacheItem } from '../../types'
import { MultiCacheState } from '../../helpers/MultiCacheState'
import { logger } from '../../helpers/logger'
import { setCachedResponse } from '../../helpers/routeCache'
import { useRuntimeConfig } from '#imports'

function canBeServedFromCache(
  key: string,
  decoded: RouteCacheItem,
  state: MultiCacheState,
): boolean {
  const now = Date.now() / 1000
  const isExpired = decoded.expires ? now >= decoded.expires : false

  // Item is not expired, so we can serve it.
  if (!isExpired) {
    return true
  }

  // The route may be served stale while revalidating if it currently is being
  // revalidated.
  if (decoded.staleWhileRevalidate && state.isBeingRevalidated(key)) {
    return true
  }

  // Is both expired and not eligible to be served stale while revalidating.
  return false
}

export async function serveCachedHandler(event: H3Event) {
  try {
    const { serverOptions, state } = useMultiCacheApp()
    const context = getMultiCacheContext(event)

    if (!context?.route) {
      return
    }

    // Build the cache key.
    const fullKey = serverOptions?.route?.buildCacheKey
      ? serverOptions.route.buildCacheKey(event)
      : getCacheKeyWithPrefix(encodeRouteCacheKey(event.path), event)

    // Check if there is a cache entry for this key.
    const cachedRaw = handleRawCacheData(
      await context.route.getItemRaw(fullKey),
    )

    // No cache entry.
    if (!cachedRaw) {
      return
    }
    const decoded = decodeRouteCacheItem(cachedRaw)

    // Decoding failed. May happen if the format is wrong, possibly after a
    // deployment with a newer version.
    if (!decoded) {
      return
    }

    // Store the decoded cache item in the event context.
    event.__MULTI_CACHE_DECODED_CACHED_ROUTE = decoded

    // Check if item can be served from cache.
    if (!canBeServedFromCache(fullKey, decoded, state)) {
      // Mark the key as being revalidated.
      if (decoded.staleWhileRevalidate) {
        state.addKeyBeingRevalidated(fullKey)
        event.__MULTI_CACHE_REVALIDATION_KEY = fullKey
      }

      // Returning, so the route is revalidated.
      return
    }

    const debugEnabled = useRuntimeConfig().multiCache.debug

    if (debugEnabled) {
      logger.info('Serving cached route for path: ' + event.path, {
        fullKey,
      })
    }

    setCachedResponse(event, decoded)

    return decoded.data
  } catch (e) {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.debug(e.message)
    }
  }
}
