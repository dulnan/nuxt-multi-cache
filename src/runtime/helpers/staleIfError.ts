import type { H3Event } from 'h3'
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
