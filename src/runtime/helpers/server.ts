import { type H3Event, getRequestURL } from 'h3'
import type { CacheItem, NuxtMultiCacheSSRContext } from './../types'
import type { NuxtMultiCacheRouteCacheHelper } from './RouteCacheHelper'
import { serverOptions } from '#nuxt-multi-cache/server-options'

export const MULTI_CACHE_CONTEXT_KEY = 'multiCacheApp'
export const MULTI_CACHE_ROUTE_CONTEXT_KEY = '__MULTI_CACHE_ROUTE'
export const MULTI_CACHE_CDN_CONTEXT_KEY = '__MULTI_CACHE_CDN'

/**
 * Granular check whether caching is enabled for a given request.
 *
 * That way it's possible to exclude some requests from getting or setting
 * something from cache.
 */
export async function enabledForRequest(event: H3Event): Promise<boolean> {
  if (!event.context) {
    event.context = {}
  }

  if (!event.context.multiCache) {
    event.context.multiCache = {}
  }

  if (event.context.multiCache.enabledForRequest === undefined) {
    if (serverOptions.enabledForRequest) {
      const isEnabled = await serverOptions.enabledForRequest(event)
      event.context.multiCache.enabledForRequest = !!isEnabled
    } else {
      event.context.multiCache.enabledForRequest = true
    }
  }

  return event.context.multiCache.enabledForRequest
}

export function getMultiCacheContext(
  event: H3Event,
): NuxtMultiCacheSSRContext | undefined {
  return event.context.multiCacheApp?.cache
}

export function getMultiCacheRouteHelper(
  event: H3Event,
): NuxtMultiCacheRouteCacheHelper | undefined {
  return event.context?.[MULTI_CACHE_ROUTE_CONTEXT_KEY]
}

export function getExpiresValue(maxAge: number) {
  return Math.round(Date.now() / 1000 + maxAge)
}

export function isExpired(item: CacheItem) {
  return item.expires ? Date.now() / 1000 > item.expires : false
}

async function determinePrefix(event: H3Event): Promise<string> {
  // Set the global cache key prefix that applies for all caches.
  // This can either be a static string or a method that determines the prefix,
  // for example based on cookie or request headers.
  if (serverOptions.cacheKeyPrefix) {
    if (typeof serverOptions.cacheKeyPrefix === 'string') {
      return serverOptions.cacheKeyPrefix
    } else {
      const runtimePrefix = await serverOptions.cacheKeyPrefix(event)
      if (typeof runtimePrefix === 'string') {
        return runtimePrefix
      }
    }
  }

  return ''
}

export async function getCacheKeyWithPrefix(
  cacheKey: string,
  event: H3Event,
): Promise<string> {
  if (!event.context) {
    event.context = {}
  }

  if (!event.context.multiCache) {
    event.context.multiCache = {}
  }

  let prefix = event.context.multiCache.cachePrefix

  // Determine the prefix only once.
  if (prefix === undefined) {
    prefix = await determinePrefix(event)
    event.context.multiCache.cachePrefix = prefix
  }

  return prefix ? `${prefix}--${cacheKey}` : cacheKey
}

/**
 * Unstorage does some magic to the key if it contains / or ?. This method
 * handles this.
 */
export function encodeRouteCacheKey(event: H3Event): string {
  const path = getRequestURL(event).pathname

  const questionMarkIndex = path.indexOf('?')
  if (questionMarkIndex >= 0) {
    return path.substring(0, questionMarkIndex)
  }
  return path
}

/**
 * Filter out duplicate array items.
 */
export function onlyUnique(value: string, index: number, self: Array<string>) {
  return self.indexOf(value) === index
}
