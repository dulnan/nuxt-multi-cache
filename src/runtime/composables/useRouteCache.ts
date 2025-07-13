import type { H3Event } from 'h3'
import type { NuxtMultiCacheRouteCacheHelper } from './../helpers/RouteCacheHelper'
import { getMultiCacheRouteHelper } from './../helpers/server'
import { useRequestEvent } from '#imports'
import { isServer } from '#nuxt-multi-cache/config'

/**
 * Get the helper to be used for interacting with the route cache.
 *
 * The helper provides ways to set the cacheability, cache tags, max age for
 * the current route.
 *
 * The helper is provided via a callback, which is only called server side.
 * That way the entire code path, incl. calling useRouteCache, is removed
 * from client bundles.
 */
export function useRouteCache(
  cb: (helper: NuxtMultiCacheRouteCacheHelper) => void,
  providedEvent?: H3Event,
): void {
  if (!isServer) {
    return
  }

  const event = providedEvent || useRequestEvent()

  if (!event) {
    return
  }

  const helper = getMultiCacheRouteHelper(event)

  if (!helper) {
    return
  }

  cb(helper)
}
