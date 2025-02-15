import { type H3Event, getRequestURL } from 'h3'
import type { NuxtMultiCacheSSRContext } from '../../types'
import {
  MULTI_CACHE_CDN_CONTEXT_KEY,
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_PREFIX_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
} from '../../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../helpers/RouteCacheHelper'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { NuxtMultiCacheCDNHelper } from '../../helpers/CDNHelper'

/**
 * Add the cache context singleton to the current request.
 */
async function addCacheContext(
  event: H3Event,
): Promise<NuxtMultiCacheSSRContext> {
  const { cache, serverOptions, config } = useMultiCacheApp()

  // Set the global cache key prefix that applies for all caches.
  // This can either be a static string or a method that determines the prefix,
  // for example based on cookie or request headers.
  if (serverOptions.cacheKeyPrefix) {
    if (typeof serverOptions.cacheKeyPrefix === 'string') {
      event[MULTI_CACHE_PREFIX_KEY] = serverOptions.cacheKeyPrefix
    } else {
      event[MULTI_CACHE_PREFIX_KEY] = await serverOptions.cacheKeyPrefix(event)
    }
  }

  // Add the cache context object to the SSR context object.
  event[MULTI_CACHE_CONTEXT_KEY] = cache

  if (cache.route) {
    // Add the route cache helper.
    event[MULTI_CACHE_ROUTE_CONTEXT_KEY] = new NuxtMultiCacheRouteCacheHelper()
  }

  if (config.cdn.enabled) {
    const helper = new NuxtMultiCacheCDNHelper()

    // Add the instances to the H3 event context.
    event[MULTI_CACHE_CDN_CONTEXT_KEY] = helper
  }

  return cache
}

/**
 * Granular check whether caching is enabled for a given request.
 *
 * That way it's possible to exclude some requests from getting or setting
 * something from cache.
 */
function enabledForRequest(event: H3Event): Promise<boolean> {
  const { serverOptions } = useMultiCacheApp()
  // App provided custom check.
  if (serverOptions.enabledForRequest) {
    return serverOptions.enabledForRequest(event)
  }

  // Fallback to true.
  return Promise.resolve(true)
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

  // Users may provide a custom method to determine whether caching is enabled
  // for a given request or not.
  const cachingEnabled = await enabledForRequest(event)

  if (!cachingEnabled) {
    return
  }

  // Add the cache context.
  await addCacheContext(event)
}
