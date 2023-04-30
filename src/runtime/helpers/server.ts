import type { H3Event } from 'h3'
import type { CacheItem, NuxtMultiCacheSSRContext } from './../types'
import type { NuxtMultiCacheCDNHelper } from './CDNHelper'
import type { NuxtMultiCacheRouteCacheHelper } from './RouteCacheHelper'

export const MULTI_CACHE_CONTEXT_KEY = '__MULTI_CACHE'
export const MULTI_CACHE_ROUTE_CONTEXT_KEY = '__MULTI_CACHE_ROUTE'
export const MULTI_CACHE_CDN_CONTEXT_KEY = '__MULTI_CACHE_CDN'

export function getMultiCacheContext(
  event: H3Event,
): NuxtMultiCacheSSRContext | undefined {
  return event?.context?.[MULTI_CACHE_CONTEXT_KEY]
}

export function getMultiCacheRouteHelper(
  event: H3Event,
): NuxtMultiCacheRouteCacheHelper {
  return event?.context?.[MULTI_CACHE_ROUTE_CONTEXT_KEY]
}

export function getMultiCacheCDNHelper(
  event: H3Event,
): NuxtMultiCacheCDNHelper | undefined {
  return event?.context?.[MULTI_CACHE_CDN_CONTEXT_KEY]
}

export function getExpiresValue(maxAge: number) {
  return Math.round(Date.now() / 1000 + maxAge)
}

export function isExpired(item: CacheItem) {
  return item.expires ? Date.now() / 1000 > item.expires : false
}

export function getCacheKeyWithPrefix(
  cacheKey: string,
  cachePrefix: string | undefined,
): string {
  return cachePrefix ? `${cachePrefix}::${cacheKey}` : cacheKey
}
