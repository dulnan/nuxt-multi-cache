import { type H3Event, getRequestURL } from 'h3'
import type { NuxtMultiCacheSSRContext } from '../../types'
import {
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
} from '../../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../helpers/RouteCacheHelper'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'

/**
 * Add the cache context singleton to the current request.
 */
async function addCacheContext(
  event: H3Event,
): Promise<NuxtMultiCacheSSRContext> {
  const { cache } = useMultiCacheApp()

  // Add the cache context object to the SSR context object.
  event.context[MULTI_CACHE_CONTEXT_KEY] = cache

  if (cache.route) {
    // Add the route cache helper.
    event.context[MULTI_CACHE_ROUTE_CONTEXT_KEY] =
      new NuxtMultiCacheRouteCacheHelper()
  }

  return cache
}

/**
 * Method to check whether route caching is generally applicable to the given path.
 */
function applies(path: string): boolean {
  const { serverOptions } = useMultiCacheApp()

  if (serverOptions.route?.applies) {
    return serverOptions.route.applies(path)
  }

  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt_error')) {
    return false
  }

  // Exclude common files.
  return !/.\.(ico|png|jpg|js|css|html|woff|woff2|ttf|otf|eot|svg)$/.test(path)
}

/**
 * Callback for the 'request' nitro hook.
 *
 * This adds the context objects to the event and, if enabled, serves cached
 * routes.
 */
export async function onRequest(event: H3Event) {
  const url = getRequestURL(event)
  const path = url.pathname + url.search
  if (!path) {
    return
  }

  // Path is generally not cacheable, so we can skip it.
  if (!applies(path)) {
    return
  }

  // Add the cache context.
  await addCacheContext(event)
}
