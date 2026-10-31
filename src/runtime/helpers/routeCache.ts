import {
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
  type H3Event,
} from 'h3'
import { normalizeKey } from 'unstorage'
import { joinURL, withTrailingSlash } from 'ufo'
import type { CacheableItemInterface, RouteCacheItem } from '../types'
import {
  ROUTE_CACHE_EXPIRES_HEADER,
  ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER,
  ROUTE_CACHE_TAGS_HEADER,
} from './constants'
import {
  encodeRouteCacheKey,
  getCacheKeyWithPrefix,
  isInternalServerRequest,
} from './server'
import { serverOptions } from '#nuxt-multi-cache/server-options'
import { apiPrefix } from '#nuxt-multi-cache/config'

/**
 * The cache key for routes whose key would otherwise be empty, such as the
 * root path "/".
 *
 * "{" and "}" are always percent-encoded in URL paths, so no request path can
 * produce this key.
 */
export const ROOT_ROUTE_CACHE_KEY = '{root}'

/**
 * Whether the request method can use the route cache.
 *
 * Only GET and HEAD requests are served from or stored in the route cache.
 * Other methods must always reach their handler, even if a GET request to the
 * same path has been cached.
 */
export function isRouteCacheMethod(event: H3Event): boolean {
  return event.method === 'GET' || event.method === 'HEAD'
}

/**
 * Whether the path must never be served from or stored in the route cache.
 *
 * This applies to Nuxt's build assets and error page and to the module's own
 * API, whose responses must never be served without authorization. All of
 * them are served below the app's base URL.
 *
 * @param path - The request path, including the base URL.
 * @param app - The app runtime config.
 */
export function isExcludedRoutePath(
  path: string,
  app: { baseURL: string; buildAssetsDir: string },
): boolean {
  const prefixes = [
    joinURL(app.baseURL, app.buildAssetsDir),
    joinURL(app.baseURL, '/__nuxt_error'),
  ]

  if (apiPrefix) {
    prefixes.push(withTrailingSlash(joinURL(app.baseURL, apiPrefix)))
  }

  return prefixes.some((prefix) => path.startsWith(prefix))
}

/**
 * Matches paths with a double slash, a backslash or a dot segment.
 */
const AMBIGUOUS_PATH_RE = /\/\/|\\|(?:^|\/)\.\.?(?:\/|$)/

/**
 * Whether the request path can be read as a different path.
 *
 * The route cache key is built with getRequestURL(), which collapses leading
 * slashes and resolves dot segments. The router and the Nuxt renderer use the
 * path as it is: Nuxt renders "//contact" as the home page of the host
 * "contact", and Nitro routes "/api/files/../../contact" to "/api/files/**".
 * Their response would be stored under the key of another path, so requests
 * with such a path never use the route cache.
 *
 * @param path - The decoded request path, optionally with the query string.
 */
export function isAmbiguousRoutePath(path: string): boolean {
  const queryIndex = path.indexOf('?')
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex)
  return AMBIGUOUS_PATH_RE.test(pathname)
}

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

/**
 * Set the route cacheability as headers for internal requests from the Nuxt
 * app during SSR, so useCacheAwareFetchInterceptor can merge it into the
 * route of the page.
 */
export function setInternalRouteCacheHeaders(
  event: H3Event,
  item: CacheableItemInterface,
) {
  if (!isInternalServerRequest(event)) {
    return
  }

  setResponseHeader(
    event,
    ROUTE_CACHE_TAGS_HEADER,
    (item.cacheTags ?? []).join(' '),
  )

  if (item.expires !== null && item.expires !== undefined) {
    setResponseHeader(event, ROUTE_CACHE_EXPIRES_HEADER, item.expires)
  }

  if (
    item.staleIfErrorExpires !== null &&
    item.staleIfErrorExpires !== undefined
  ) {
    setResponseHeader(
      event,
      ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER,
      item.staleIfErrorExpires,
    )
  }
}

export function setCachedResponse(event: H3Event, decoded: RouteCacheItem) {
  setInternalRouteCacheHeaders(event, decoded)

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
