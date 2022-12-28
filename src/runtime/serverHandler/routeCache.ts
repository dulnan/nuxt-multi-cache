import { ServerResponse } from 'http'
import { defineEventHandler, setResponseHeaders } from 'h3'
import {
  getMultiCacheContext,
  getMultiCacheRouteContext,
} from '../helpers/server'

/**
 * Route cache event handler.
 *
 * Returns a cached response if available and caches responses if they are
 * marked cacheable.
 */
export default defineEventHandler(async (event) => {
  if (!event.path) {
    return
  }

  const multiCache = getMultiCacheContext(event)
  if (!multiCache?.route) {
    return
  }

  try {
    // Check if there is a cache entry for this path.
    const cached = await multiCache.route.getItem(event.path)
    if (cached && typeof cached === 'object') {
      const { data, headers, statusCode } = cached as any
      if (headers) {
        setResponseHeaders(event, headers)
      }
      if (statusCode) {
        event.node.res.statusCode = statusCode
      }
      return data
    }
  } catch (e) {
    console.debug(e)
  }

  // Store the original end method that sends the response data.
  const _end = event.node.res.end

  // Overwrite with custom method.
  event.node.res.end = function (chunk: any, encoding: any, cb: any) {
    // This is executed right before the request is ended.
    const routeContext = getMultiCacheRouteContext(event)

    // Set the cache entry if the route is set as cacheable.
    if (routeContext && routeContext.cacheable) {
      const multiCache = getMultiCacheContext(event)
      if (multiCache?.route && event.path) {
        const response = event.node.res as ServerResponse
        const headers = response.getHeaders()
        const item = { data: chunk, cacheTags: routeContext.tags, headers }
        multiCache.route.setItem(event.path, item)
      }
    }

    // Call the original end method.
    _end.call(event.node.res, chunk, encoding, cb)
    return this
  }.bind(event.node.res)
})
