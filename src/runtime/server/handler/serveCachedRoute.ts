import { type H3Event, getRequestURL } from 'h3'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import {
  enabledForRequest,
  getMultiCacheContext,
  getRequestTimestamp,
} from '../../helpers/server'
import {
  decodeRouteCacheItem,
  handleRawCacheData,
} from '../../helpers/cacheItem'
import type { RouteCacheItem } from '../../types'
import type { MultiCacheState } from '../../helpers/MultiCacheState'
import { logger } from '../../helpers/multi-cache-logger'
import {
  getRouteCacheKey,
  isExcludedRoutePath,
  isRouteCacheMethod,
  setCachedResponse,
} from '../../helpers/routeCache'
import { debug } from '#nuxt-multi-cache/config'
import { useRuntimeConfig } from '#imports'
import { isExpired } from '../../helpers/maxAge'

function canBeServedFromCache(
  event: H3Event,
  key: string,
  decoded: RouteCacheItem,
  state: MultiCacheState,
): boolean {
  // Item is not expired, so we can serve it.
  if (!isExpired(decoded.expires, getRequestTimestamp(event))) {
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
  // Other methods (e.g. POST) are never served from cache.
  if (!isRouteCacheMethod(event)) {
    return
  }

  // Neither are the module's own API or Nuxt's assets, even if an item for
  // the path exists in the cache.
  if (
    isExcludedRoutePath(getRequestURL(event).pathname, useRuntimeConfig().app)
  ) {
    return
  }

  const isEnabled = await enabledForRequest(event)

  if (!isEnabled) {
    return
  }

  const context = getMultiCacheContext(event)

  if (!context?.route) {
    return
  }

  const { state } = useMultiCacheApp()

  try {
    // Build the cache key.
    const fullKey = await getRouteCacheKey(event)

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
    event.context.multiCache ||= {}
    event.context.multiCache.routeCachedDecoded = decoded

    // Check if item can be served from cache.
    if (!canBeServedFromCache(event, fullKey, decoded, state)) {
      // Mark the key as being revalidated.
      if (decoded.staleWhileRevalidate) {
        state.addKeyBeingRevalidated(fullKey)
        event.context.multiCache ||= {}
        event.context.multiCache.routeRevalidationkey = fullKey
      }

      // Returning, so the route is revalidated.
      return
    }

    if (debug) {
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
