import { type H3Event, getRequestURL } from 'h3'
import type { MultiCacheInstances } from './../types'
import type { CacheTagRegistry } from './../types/CacheTagRegistry'
import type { NuxtMultiCacheRouteCacheHelper } from './RouteCacheHelper'
import { isServer } from '#nuxt-multi-cache/config'
import { getRequestHeader } from 'h3'
import { SERVER_REQUEST_HEADER } from './constants'
import { toTimestamp } from './maxAge'

export const MULTI_CACHE_CONTEXT_KEY = 'multiCacheApp'

/**
 * Granular check whether caching is enabled for a given request.
 *
 * That way it's possible to exclude some requests from getting or setting
 * something from cache.
 */
export async function enabledForRequest(event: H3Event): Promise<boolean> {
  if (!isServer) {
    return Promise.resolve(false)
  }

  event.context ||= {}
  event.context.multiCache ||= {}

  if (event.context.multiCache.enabledForRequest === undefined) {
    const serverOptions = await import('#nuxt-multi-cache/server-options').then(
      (v) => v.serverOptions,
    )
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
): MultiCacheInstances | undefined {
  return event.context.multiCacheApp?.cache
}

export function getCacheTagRegistry(
  event: H3Event,
): CacheTagRegistry | undefined {
  return event.context.multiCacheApp?.cacheTagRegistry ?? undefined
}

export function getMultiCacheRouteHelper(
  event: H3Event,
): NuxtMultiCacheRouteCacheHelper | undefined {
  return event.context?.multiCache?.route
}

async function determinePrefix(event: H3Event): Promise<string> {
  if (!isServer) {
    return Promise.resolve('')
  }
  const serverOptions = await import('#nuxt-multi-cache/server-options').then(
    (v) => v.serverOptions,
  )
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
  event.context ||= {}
  event.context.multiCache ||= {}

  let prefix = event.context.multiCache.cachePrefix

  // Determine the prefix only once.
  if (prefix === undefined) {
    prefix = await determinePrefix(event)
    event.context.multiCache.cachePrefix = prefix
  }

  return prefix ? `${prefix}--${cacheKey}` : cacheKey
}

export function getRequestTimestamp(event: H3Event): number {
  event.context ||= {}
  event.context.multiCache ||= {}
  event.context.multiCache.requestTimestamp ||= toTimestamp(new Date())
  return event.context.multiCache.requestTimestamp
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

export function isInternalServerRequest(event: H3Event): boolean {
  event.context ||= {}
  event.context.multiCache ||= {}

  if (event.context.multiCache.isInternalServerRequest === undefined) {
    const isServerRequest =
      getRequestHeader(event, SERVER_REQUEST_HEADER) === 'true'
    event.context.multiCache.isInternalServerRequest = isServerRequest
  }

  return event.context.multiCache.isInternalServerRequest
}

/**
 * Filter out duplicate array items.
 */
export function onlyUnique(value: string, index: number, self: Array<string>) {
  return self.indexOf(value) === index
}
