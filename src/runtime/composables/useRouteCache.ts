import type { H3Event } from 'h3'
import { getCurrentInstance, useSSRContext } from 'vue'
import { NuxtMultiCacheRouteCacheHelper } from './../helpers/RouteCacheHelper'
import { getMultiCacheRouteHelper } from './../helpers/server'

/**
 * Get the helper to be used for interacting with the route cache.
 *
 * The helper provides ways to set the cacheability, cache tags, max age for
 * the current route.
 *
 * The helper is provided via a callback, which is only called server side.
 * That way the entire code patch, incl. calling useRouteCache, is removed
 * from client bundles.
 */
export function useRouteCache(
  cb: (helper: NuxtMultiCacheRouteCacheHelper) => void,
  providedEvent?: H3Event,
): void {
  if (process.client) {
    return
  }

  const event: H3Event = (() => {
    // Event provided by user.
    if (providedEvent) {
      return providedEvent
    }

    // Prevent logging warnings when not in vue context.
    if (!getCurrentInstance()) {
      return
    }

    // SSR context should exist at this point, but TS doesn't know that.
    const ssrContext = useSSRContext()
    if (ssrContext) {
      return ssrContext.event
    }
  })()

  if (!event) {
    return
  }

  const helper = getMultiCacheRouteHelper(event)
  if (!helper) {
    return
  }

  cb(helper)
}
