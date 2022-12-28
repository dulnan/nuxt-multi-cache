import type { ServerResponse } from 'http'
import { defineEventHandler, setResponseHeaders } from 'h3'
import { format } from '@tusbar/cache-control'
import {
  getMultiCacheCDNHelper,
  getMultiCacheContext,
  getMultiCacheRouteHelper,
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

  const response: ServerResponse = event.node.res

  // Store the original end method that sends the response data.
  const _end = event.node.res.end

  // Overwrite with custom method. This is at the very end of the request,
  // after which no more changes to the state can be made.
  event.node.res.end = function (chunk: any, encoding: any, cb: any) {
    // Add CDN headers first.
    const cdnHelper = getMultiCacheCDNHelper(event)
    if (cdnHelper) {
      const cacheTagsValue = cdnHelper._tags.join(' ')
      if (cacheTagsValue) {
        response.setHeader('Cache-Tag', cacheTagsValue)
      }

      const cacheControlValue = format(cdnHelper._control)
      if (cacheControlValue) {
        response.setHeader('Surrogate-Control', cacheControlValue)
      }
    }

    // Handle route caching.
    const routeHelper = getMultiCacheRouteHelper(event)

    // Set the cache entry if the route is set as cacheable.
    if (routeHelper && routeHelper.cacheable) {
      const multiCache = getMultiCacheContext(event)
      if (multiCache?.route && event.path) {
        const response = event.node.res as ServerResponse
        const headers = response.getHeaders()
        const item = { data: chunk, cacheTags: routeHelper.tags, headers }
        multiCache.route.setItem(event.path, item)
      }
    }

    // Call the original end method.
    _end.call(event.node.res, chunk, encoding, cb)
    return this
  }.bind(event.node.res)
})
