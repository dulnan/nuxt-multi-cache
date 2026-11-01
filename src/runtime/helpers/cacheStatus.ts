import { type H3Event, getResponseHeader, setResponseHeader } from 'h3'
import { CACHE_NEVER, CACHE_PERMANENT } from './maxAge'
import { DEFAULT_CACHE_STATUS_NAME } from './constants'

/**
 * How the route cache handled a request: The parameters of its entry in the
 * Cache-Status header (RFC 9211). Either `hit` or `fwd` is set.
 */
export type RouteCacheStatus = {
  /**
   * The response was served from the route cache.
   */
  hit?: boolean

  /**
   * Why the response was not served from the route cache:
   * - bypass: The route cache doesn't handle the request.
   * - method: The request method can't use the route cache.
   * - uri-miss: No item is stored for the request.
   * - miss: The item could not be loaded.
   * - stale: The stored item is expired.
   */
  fwd?: 'bypass' | 'method' | 'uri-miss' | 'miss' | 'stale'

  /**
   * The status code of the response of the app, if a stale route was served
   * instead.
   */
  fwdStatus?: number

  /**
   * The remaining time to live of the response in seconds, negative if it's
   * stale.
   */
  ttl?: number

  /**
   * The response is stored in the route cache.
   */
  stored?: boolean
}

const CACHE_STATUS_HEADER = 'cache-status'

/**
 * Matches a token of structured field values (RFC 8941).
 */
const TOKEN_RE = /^[a-z*][\w!#$%&'*+.^`|~:/-]*$/i

/**
 * Matches the characters allowed in a string of structured field values.
 */
const PRINTABLE_ASCII_RE = /^[\x20-\x7e]+$/

/**
 * The name of the route cache in the Cache-Status header, as a token or a
 * string of structured field values (RFC 8941).
 *
 * @param option - The value of the option: `true` for the default name or a
 *   name. Anything else, including an empty string, disables the header.
 *   Names with characters other than printable ASCII can't be sent, so the
 *   default name is used instead.
 *
 * @returns The serialized name, or undefined if the header is disabled.
 */
export function getCacheStatusName(option: unknown): string | undefined {
  if (option === true) {
    return DEFAULT_CACHE_STATUS_NAME
  } else if (typeof option !== 'string' || !option.trim()) {
    return
  } else if (TOKEN_RE.test(option)) {
    return option
  } else if (PRINTABLE_ASCII_RE.test(option)) {
    return `"${option.replace(/[\\"]/g, '\\$&')}"`
  }

  return DEFAULT_CACHE_STATUS_NAME
}

/**
 * The remaining time to live of a route cache item in seconds, negative if
 * it's expired. Undefined for items without a max age.
 */
export function getCacheStatusTtl(
  expires: number,
  now: number,
): number | undefined {
  if (expires === CACHE_PERMANENT) {
    return
  } else if (expires === CACHE_NEVER) {
    // Items with a max age of 0 are only stored as a stale copy.
    return 0
  }

  return expires - now
}

/**
 * Serialize the entry of the route cache in the Cache-Status header.
 */
export function serializeCacheStatus(
  name: string,
  status: RouteCacheStatus,
): string {
  const parts = [name]

  if (status.hit) {
    parts.push('hit')
  }

  if (status.fwd) {
    parts.push(`fwd=${status.fwd}`)
  }

  if (status.fwdStatus !== undefined) {
    parts.push(`fwd-status=${status.fwdStatus}`)
  }

  if (status.ttl !== undefined) {
    parts.push(`ttl=${status.ttl}`)
  }

  if (status.stored) {
    parts.push('stored')
  }

  return parts.join('; ')
}

/**
 * Append the entry of the route cache to the value of a Cache-Status header.
 *
 * Entries of caches closer to the origin, e.g. of an API whose response is
 * proxied, come first.
 */
export function appendCacheStatus(existing: unknown, entry: string): string {
  const value = Array.isArray(existing) ? existing.join(', ') : existing
  return value ? `${value}, ${entry}` : entry
}

/**
 * Store how the route cache handled the request, for the Cache-Status header.
 */
export function setRouteCacheStatus(event: H3Event, status: RouteCacheStatus) {
  event.context.multiCache ||= {}
  event.context.multiCache.routeCacheStatus = status
}

/**
 * Add the entry of the route cache to the Cache-Status header.
 *
 * The header's value with and without the entry is kept in the event context,
 * so that the entry can be replaced, and removed before the response is
 * stored.
 */
export function addCacheStatusHeader(
  event: H3Event,
  name: string,
  status: RouteCacheStatus,
) {
  if (event.node.res.headersSent) {
    return
  }

  event.context.multiCache ||= {}
  const current = getResponseHeader(event, CACHE_STATUS_HEADER)
  const added = event.context.multiCache.routeCacheStatusHeader

  // Replace the entry if it was already added, unless the header has been set
  // again since then.
  const before = added && current === added.value ? added.before : current
  const value = appendCacheStatus(before, serializeCacheStatus(name, status))

  setResponseHeader(event, CACHE_STATUS_HEADER, value)
  event.context.multiCache.routeCacheStatusHeader = { before, value }
}
