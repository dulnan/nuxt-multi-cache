import { type H3Event } from 'h3'
import type { CapturedErrorContext } from 'nitropack/types'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { MultiCacheApp } from '../../types'
import {
  decodeRouteCacheItem,
  handleRawCacheData,
} from '../../helpers/cacheItem'
import { serveCachedRoute } from '../../helpers/routeCache'

/**
 * Handler to serve a stale route if an expired route returns an error while revalidating.
 */
async function serveStaleIfError(app: MultiCacheApp, event: H3Event) {
  // Route caching not enabled.
  if (!app.cache.route) {
    return
  }

  // Get the route cache key.
  // It is added by the "request" nitro hook.
  // If it's not available, it means the route is generally not cacheable or
  // that there is no cache entry available.
  // We do it this way to prevent loading the same item from cache twice.
  const fullKey = event.context.__MULTI_CACHE_ROUTE_CACHE_KEY

  if (!fullKey) {
    return
  }

  // Check if there is a cache entry for this key.
  const cachedRaw = handleRawCacheData(
    await app.cache.route.getItemRaw(fullKey),
  )

  if (!cachedRaw) {
    return
  }

  const decoded = decodeRouteCacheItem(cachedRaw)
  if (!decoded) {
    return
  }

  // Check whether we may serve a stale item for this route.
  if (!decoded.staleIfErrorExpires) {
    return
  }

  const now = Date.now() / 1000
  if (now >= decoded.staleIfErrorExpires) {
    return
  }

  serveCachedRoute(event, decoded)
}

/**
 * Callback for the 'beforeResponse' nitro hook.
 *
 * This is called after a valid response was built, but before it is sent.
 */
export async function onError(error: Error, ctx: CapturedErrorContext) {
  try {
    if (!ctx.event) {
      return
    }
    const app = useMultiCacheApp()
    await serveStaleIfError(app, ctx.event)
  } catch (_e) {}
}
