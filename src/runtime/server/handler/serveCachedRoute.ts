import { type H3Event, getRequestURL, getResponseHeaders } from 'h3'
import type { Storage } from 'unstorage'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import {
  getMultiCacheContext,
  getMultiCacheRouteHelper,
  getRequestTimestamp,
  isValidCacheKey,
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
  isRouteCacheMethod,
  setCachedResponse,
} from '../../helpers/routeCache'
import { debug } from '#nuxt-multi-cache/config'
import { isExpired } from '../../helpers/maxAge'
import {
  getCacheStatusTtl,
  setRouteCacheStatus,
} from '../../helpers/cacheStatus'
import { copyHeaders } from '../../helpers/staleIfError'

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

/**
 * The result of looking up a route in the cache.
 */
type Lookup =
  | { served: true; data: unknown }
  | {
      served: false
      /**
       * Whether the app renders the route without any response to serve
       * meanwhile, so concurrent requests may wait for its result.
       */
      mayCoalesce: boolean
    }

async function lookup(
  event: H3Event,
  storage: Storage,
  state: MultiCacheState,
  fullKey: string,
): Promise<Lookup> {
  // Check if there is a cache entry for this key.
  const cachedRaw = handleRawCacheData(await storage.getItemRaw(fullKey))

  // No cache entry.
  if (!cachedRaw) {
    setRouteCacheStatus(event, { fwd: 'uri-miss' })
    return { served: false, mayCoalesce: true }
  }
  const decoded = decodeRouteCacheItem(cachedRaw)

  // Decoding failed. May happen if the format is wrong, possibly after a
  // deployment with a newer version.
  if (!decoded) {
    setRouteCacheStatus(event, { fwd: 'miss' })
    return { served: false, mayCoalesce: true }
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

    setRouteCacheStatus(event, { fwd: 'stale' })

    // If revalidating fails, the stale route may be served. This handler
    // runs first, so these are the headers a cache hit would have.
    event.context.multiCache.routeInitialHeaders = copyHeaders(
      getResponseHeaders(event),
    )

    // Returning, so the route is revalidated. Concurrent requests get the
    // stale route while it's revalidated.
    return { served: false, mayCoalesce: !decoded.staleWhileRevalidate }
  }

  if (debug) {
    const url = getRequestURL(event)
    logger.info('Serving cached route for path: ' + url.toString(), {
      fullKey,
    })
  }

  setCachedResponse(event, decoded)

  // The ttl is negative if a stale route is served while revalidating.
  setRouteCacheStatus(event, {
    hit: true,
    ttl: getCacheStatusTtl(decoded.expires, getRequestTimestamp(event)),
  })

  return { served: true, data: decoded.data }
}

export async function serveCachedHandler(event: H3Event) {
  // The request hook only adds the route helper if the route cache applies to
  // the request: Not for the module's own API, Nuxt's assets, paths excluded
  // by `route.applies` (by default static files) or if `enabledForRequest`
  // returns false. Without it, the cache isn't looked up, even if an item for
  // the path exists. Requests with other methods (e.g. POST) only get the
  // helper if they are internal requests, which are never served from cache.
  if (!getMultiCacheRouteHelper(event) || !isRouteCacheMethod(event)) {
    return
  }

  const context = getMultiCacheContext(event)

  if (!context?.route) {
    return
  }

  const { state, config } = getMultiCacheApp()
  const coalesce = !!config.routeCoalesce

  try {
    // Build the cache key.
    const fullKey = await getRouteCacheKey(event)
    if (!isValidCacheKey(fullKey, 'route')) {
      setRouteCacheStatus(event, { fwd: 'bypass' })
      return
    }

    const storage = context.route.storage
    const result = await lookup(event, storage, state, fullKey)
    if (result.served) {
      return result.data
    }
    if (!coalesce || !result.mayCoalesce) {
      return
    }

    // The first request renders the route, the afterResponse hook or the
    // error handler ends the render.
    const endRender = state.startRender(fullKey)
    if (endRender) {
      event.context.multiCache ||= {}
      event.context.multiCache.routeEndRender = endRender
      return
    }

    // Other requests wait for its result. If it wasn't stored (e.g. because
    // the route is uncacheable) they render the route themselves.
    await state.waitForRender(fullKey)
    const afterWait = await lookup(event, storage, state, fullKey)
    if (afterWait.served) {
      return afterWait.data
    }
  } catch (e) {
    logger.error(
      `Error while attempting to serve cached route for path "${event.path}".`,
      e,
    )

    setRouteCacheStatus(event, { fwd: 'miss' })

    if (context.route.bubbleError) {
      throw e
    }
  }
}
