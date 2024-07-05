import { setResponseHeaders, setResponseStatus, type H3Event } from 'h3'
import type { NuxtMultiCacheSSRContext } from '../../types'
import {
  MULTI_CACHE_CDN_CONTEXT_KEY,
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_PREFIX_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
  encodeRouteCacheKey,
  getCacheKeyWithPrefix,
} from '../../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../helpers/RouteCacheHelper'
import {
  decodeRouteCacheItem,
  handleRawCacheData,
} from '../../helpers/cacheItem'
import { logger } from '../../helpers/logger'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { useRuntimeConfig } from '#imports'
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
      event.context[MULTI_CACHE_PREFIX_KEY] = serverOptions.cacheKeyPrefix
    } else {
      event.context[MULTI_CACHE_PREFIX_KEY] =
        await serverOptions.cacheKeyPrefix(event)
    }
  }

  // Add the cache context object to the SSR context object.
  event.context[MULTI_CACHE_CONTEXT_KEY] = cache

  if (cache.route) {
    // Add the route cache helper.
    event.context[MULTI_CACHE_ROUTE_CONTEXT_KEY] =
      new NuxtMultiCacheRouteCacheHelper()
  }

  if (config.cdn.enabled) {
    const helper = new NuxtMultiCacheCDNHelper()

    // Add the instances to the H3 event context.
    event.context[MULTI_CACHE_CDN_CONTEXT_KEY] = helper
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
  if (!event.path) {
    return
  }

  // Path is generally not cacheable, so we can skip it.
  if (!applies(event.path)) {
    return
  }

  // Users may provide a custom method to determine whether caching is enabled
  // for a given request or not.
  const shouldAdd = await enabledForRequest(event)

  if (!shouldAdd) {
    return
  }

  // Add the cache context.
  const multiCache = await addCacheContext(event)

  // Route caching is not enabled, so we can return now.
  if (!multiCache?.route) {
    return
  }

  try {
    const { serverOptions } = useMultiCacheApp()

    // Build the cache key.
    const fullKey = serverOptions?.route?.buildCacheKey
      ? serverOptions.route.buildCacheKey(event)
      : getCacheKeyWithPrefix(encodeRouteCacheKey(event.path), event)

    // Check if there is a cache entry for this path.
    const cachedRaw = handleRawCacheData(
      await multiCache.route.getItemRaw(fullKey),
    )

    if (!cachedRaw) {
      return
    }

    const decoded = decodeRouteCacheItem(cachedRaw)
    if (!decoded) {
      return
    }

    // Check if the item is stale.
    if (decoded.expires) {
      const now = Date.now() / 1000
      if (now >= decoded.expires) {
        return
      }
    }

    // Set the cached headers. The name suggests otherwise, but this appends
    // headers (e.g. does not override existing headers.)
    if (decoded.headers) {
      setResponseHeaders(event, decoded.headers)
    }

    // Set the cached response status.
    if (decoded.statusCode) {
      setResponseStatus(event, decoded.statusCode)
    }

    const debugEnabled = useRuntimeConfig().multiCache.debug

    if (debugEnabled) {
      logger.info('Serving cached route for path: ' + event.path, {
        fullKey,
      })
    }

    const response = new Response(decoded.data)

    Object.entries(decoded.headers).forEach(([name, value]) => {
      response.headers.set(name, value)
    })

    // Respond with the cached response.
    event.respondWith(response)
  } catch (e) {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.debug(e.message)
    }
  }
}
