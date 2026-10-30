import {
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
  type H3Event,
} from 'h3'
import { normalizeKey } from 'unstorage'
import type { RouteCacheItem } from '../types'
import { ROUTE_CACHE_TAGS_HEADER } from './constants'
import {
  encodeRouteCacheKey,
  getCacheKeyWithPrefix,
  isInternalServerRequest,
} from './server'
import { serverOptions } from '#nuxt-multi-cache/server-options'

/**
 * The cache key for routes whose key would otherwise be empty, such as the
 * root path "/".
 *
 * "{" and "}" are always percent-encoded in URL paths, so no request path can
 * produce this key.
 */
export const ROOT_ROUTE_CACHE_KEY = '{root}'

/**
 * Build the cache key for the route of the given event.
 */
export async function getRouteCacheKey(event: H3Event): Promise<string> {
  const key = serverOptions.route?.buildCacheKey
    ? await serverOptions.route.buildCacheKey(event)
    : await getCacheKeyWithPrefix(encodeRouteCacheKey(event), event)

  // unstorage normalizes "/" to an empty key, which it rejects.
  return normalizeKey(key) ? key : ROOT_ROUTE_CACHE_KEY
}

export function setCachedResponse(event: H3Event, decoded: RouteCacheItem) {
  if (isInternalServerRequest(event) && decoded.cacheTags) {
    setResponseHeader(
      event,
      ROUTE_CACHE_TAGS_HEADER,
      decoded.cacheTags.join(' '),
    )
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

  // Maked sure that code that runs afterwards does not store the same
  // cached response again in the cache.
  event.context.multiCache ||= {}
  event.context.multiCache.routeServedFromCache = true
}
