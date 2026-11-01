import type { OutgoingHttpHeaders } from 'node:http'
import {
  getResponseHeaders,
  removeResponseHeader,
  setResponseHeader,
  type H3Event,
} from 'h3'
import type { RouteCacheItem } from '../types'
import { isExpired } from './maxAge'
import { getRequestTimestamp } from './server'
import { getCacheStatusTtl, type RouteCacheStatus } from './cacheStatus'

/**
 * The stale route that may be served instead of an error response.
 *
 * Like the stale-if-error directive in HTTP, only server errors serve a stale
 * route. A client error, such as a 404 for deleted content, must reach the
 * client.
 */
export function getStaleRoute(
  event: H3Event,
  statusCode: number,
): RouteCacheItem | undefined {
  if (statusCode < 500) {
    return
  }

  // The cached route handler stores the item it has loaded, which is expired
  // if the route was rendered.
  const decoded = event.context.multiCache?.routeCachedDecoded
  if (!decoded) {
    return
  }

  // It must have a stale-if-error that is permanent (-1) or not yet expired.
  if (
    !decoded.staleIfErrorExpires ||
    isExpired(decoded.staleIfErrorExpires, getRequestTimestamp(event))
  ) {
    return
  }

  return decoded
}

/**
 * The entry of the route cache in the Cache-Status header for a stale route
 * that is served instead of an error response.
 */
export function getStaleRouteCacheStatus(
  event: H3Event,
  decoded: RouteCacheItem,
  statusCode: number,
): RouteCacheStatus {
  return {
    fwd: 'stale',
    fwdStatus: statusCode,
    ttl: getCacheStatusTtl(decoded.expires, getRequestTimestamp(event)),
  }
}

/**
 * A copy of the headers, e.g. of the response.
 */
export function copyHeaders(headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
  const copy: OutgoingHttpHeaders = {}
  for (const [name, value] of Object.entries(headers)) {
    // Multiple values (e.g. of Set-Cookie) may be appended to the same array.
    copy[name] = Array.isArray(value) ? [...value] : value
  }
  return copy
}

/**
 * Reset the headers of the response to the ones set before any handler ran.
 *
 * The stale route is then sent with the same headers as a cache hit: Headers
 * that the failed request set, e.g. a cookie for the visitor or the headers of
 * the error page, are removed.
 */
export function restoreInitialHeaders(event: H3Event) {
  for (const name of Object.keys(getResponseHeaders(event))) {
    removeResponseHeader(event, name)
  }

  const initial = event.context.multiCache?.routeInitialHeaders ?? {}
  for (const [name, value] of Object.entries(initial)) {
    if (value !== undefined) {
      setResponseHeader(event, name, value)
    }
  }
}
