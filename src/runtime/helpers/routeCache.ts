import { setResponseHeaders, setResponseStatus, type H3Event } from 'h3'
import { RouteCacheItem } from '../types'

export function setCachedResponse(event: H3Event, decoded: RouteCacheItem) {
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
  event.__MULTI_CACHE_SERVED_FROM_CACHE = true
}
