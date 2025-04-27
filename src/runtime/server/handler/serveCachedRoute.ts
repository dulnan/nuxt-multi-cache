import { type H3Event, getRequestURL } from 'h3'
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
import type { RouteCacheItem } from '../../types'
import type { MultiCacheState } from '../../helpers/MultiCacheState'
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
  const { serverOptions, state } = useMultiCacheApp()
  const context = getMultiCacheContext(event)

  if (!context?.route) {
    return
  }

  try {
    // Build the cache key.
    const fullKey = serverOptions?.route?.buildCacheKey
      ? await serverOptions.route.buildCacheKey(event)
      : getCacheKeyWithPrefix(encodeRouteCacheKey(event), event)

    // Check if there is a cache entry for this key.
    const cachedRaw = handleRawCacheData(
      await context.route.storage.getItemRaw(fullKey),
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
    event.context.__MULTI_CACHE_DECODED_CACHED_ROUTE = decoded

    // Check if item can be served from cache.
    if (!canBeServedFromCache(fullKey, decoded, state)) {
      // Mark the key as being revalidated.
      if (decoded.staleWhileRevalidate) {
        state.addKeyBeingRevalidated(fullKey)
        event.context.__MULTI_CACHE_REVALIDATION_KEY = fullKey
      }

      // Returning, so the route is revalidated.
      return
    }

    const debugEnabled = useRuntimeConfig().multiCache.debug

    if (debugEnabled) {
      const url = getRequestURL(event)
      logger.info('Serving cached route for path: ' + url.toString(), {
        fullKey,
      })
    }

    setCachedResponse(event, decoded)

    return decoded.data
  } catch (e) {
    logger.error(
      `Error while attempting to serve cached route for path "${event.path}".`,
      e,
    )

    if (context.route.bubbleError) {
      throw e
    }
  }
}
