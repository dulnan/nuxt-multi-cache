import {
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
  type H3Event,
} from 'h3'
import { normalizeKey } from 'unstorage'
import { decodePath, joinURL, withTrailingSlash } from 'ufo'
import type { CacheableItemInterface, RouteCacheItem } from '../types'
import {
  DEFAULT_ROUTE_COALESCE_TIMEOUT,
  ROUTE_CACHE_EXPIRES_HEADER,
  ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER,
  ROUTE_CACHE_TAGS_HEADER,
  ROUTE_CACHE_UNCACHEABLE_HEADER,
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
  const prefixes = [joinURL(app.baseURL, app.buildAssetsDir)]

  if (apiPrefix) {
    prefixes.push(withTrailingSlash(joinURL(app.baseURL, apiPrefix)))
  }

  return (
    isErrorPagePath(path, app) ||
    prefixes.some((prefix) => path.startsWith(prefix))
  )
}

/**
 * Whether the path is Nuxt's error page.
 *
 * Nuxt renders it with an internal request for error responses and copies
 * its response headers onto the error response.
 *
 * @param path - The request path, including the base URL.
 * @param app - The app runtime config.
 */
export function isErrorPagePath(
  path: string,
  app: { baseURL: string },
): boolean {
  return path.startsWith(joinURL(app.baseURL, '/__nuxt_error'))
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
 * Decode a URL path the way h3 decodes event.path: "%2F" and "%25" stay
 * encoded.
 */
function decodeRequestPath(path: string): string {
  return path.includes('%25')
    ? decodePath(path.replace(/%25/g, '%2525'))
    : decodePath(path)
}

/**
 * Whether the default cache key would be built from another path than the
 * one that is rendered.
 *
 * The key is built from the request URL, which resolves dot segments in the
 * raw path. The router and the Nuxt renderer use the decoded path up to the
 * first "?". An encoded "?" makes them differ: For "/a%3F/../b", the app
 * renders "/a", but the key is "/b". Requests whose decoded key path isn't
 * the rendered path never use the route cache.
 *
 * @param event - The event, whose path is the decoded request path.
 */
export function isMismatchedRouteKeyPath(event: H3Event): boolean {
  const renderedPath = event.path.split('?')[0]
  return decodeRequestPath(encodeRouteCacheKey(event)) !== renderedPath
}

/**
 * Build the cache key for the route of the given event.
 */
export async function getRouteCacheKey(event: H3Event): Promise<string> {
  const key = serverOptions.route?.buildCacheKey
    ? await serverOptions.route.buildCacheKey(event)
    : await getCacheKeyWithPrefix(encodeRouteCacheKey(event), event)

  // unstorage normalizes "/" to an empty key, which it rejects. It also cuts
  // off everything from "?", so a key such as "/?q=x" (e.g. from a
  // buildCacheKey method that returns the path with the query) is empty too.
  // It must not become the root key: isValidCacheKey() skips it instead.
  return normalizeKey(key) || key.includes('?') ? key : ROOT_ROUTE_CACHE_KEY
}

/**
 * Set the route cacheability as headers for internal requests from the Nuxt
 * app during SSR, so useCacheAwareFetchInterceptor can merge it into the
 * route of the page.
 */
export function setInternalRouteCacheHeaders(
  event: H3Event,
  item: CacheableItemInterface & { cacheable?: boolean | null },
) {
  if (!isInternalServerRequest(event)) {
    return
  }

  // setUncacheable() is final, so the header is never removed again.
  if (item.cacheable === false) {
    setResponseHeader(event, ROUTE_CACHE_UNCACHEABLE_HEADER, 'true')
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

/**
 * How long concurrent requests wait for a route that another request renders,
 * in milliseconds, from the `routeCoalesce` runtime config.
 *
 * @param value - `true` for the default, a number of milliseconds, or the same
 *   as a string when it's set by an env variable.
 *
 * @returns The timeout, or 0 if coalescing is disabled.
 */
export function getCoalesceTimeout(value: unknown): number {
  if (value === true || value === 'true') {
    return DEFAULT_ROUTE_COALESCE_TIMEOUT
  }
  const timeout = Number(value)
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 0
}
