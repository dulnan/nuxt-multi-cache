import { setResponseHeaders, setResponseStatus, type H3Event } from 'h3'
import { RouteCacheItem } from '../types'

export async function serveCachedRoute(
  event: H3Event,
  decoded: RouteCacheItem,
) {
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

  // We use this to tell our "fake" event handler that runs as the very first
  // one in the stack to return a fake response (which is not actually returned
  // to the client). It just tells H3 to stop executing any other event
  // handlers.
  event.__MULTI_CACHE_SERVED_FROM_CACHE = true
  event._handled = true

  await event.respondWith(response)
}
