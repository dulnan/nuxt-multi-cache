import { setResponseHeaders, setResponseStatus, type H3Event } from 'h3'
import { RouteCacheItem } from '../types'

export function serveCachedRoute(event: H3Event, decoded: RouteCacheItem) {
  // Set the cached headers. The name suggests otherwise, but this appends
  // headers (e.g. does not override existing headers.)
  if (decoded.headers) {
    setResponseHeaders(event, decoded.headers)
  }

  // Set the cached response status.
  if (decoded.statusCode) {
    setResponseStatus(event, decoded.statusCode)
  }

  const response = new Response(decoded.data)

  Object.entries(decoded.headers).forEach(([name, value]) => {
    response.headers.set(name, value)
  })

  // Respond with the cached response.
  event.respondWith(response)
}
