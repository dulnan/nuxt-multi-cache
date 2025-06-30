import {
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
  type H3Event,
} from 'h3'
import type { RouteCacheItem } from '../types'
import { ROUTE_CACHE_TAGS_HEADER } from './constants'
import { isInternalServerRequest } from './server'

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
