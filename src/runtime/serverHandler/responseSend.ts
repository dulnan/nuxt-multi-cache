import type { ServerResponse } from 'http'
import { defineEventHandler } from 'h3'
import { format } from '@tusbar/cache-control'
import {
  getMultiCacheCDNHelper,
  getMultiCacheContext,
  getMultiCacheRouteHelper,
} from '../helpers/server'
import { RouteCacheEntry } from '../types'

/**
 * Route cache event handler.
 *
 * Returns a cached response if available and caches responses if they are
 * marked cacheable.
 */
export default defineEventHandler((event) => {
  const response: ServerResponse = event.node.res

  // Store the original end method that sends the response data.
  const _end: any = response.end

  // Overwrite with custom method. This is at the very end of the request,
  // after which no more changes to the state can be made.
  response.end = function (
    arg1: Function | any,
    arg2?: Function | string,
    arg3?: Function,
  ) {
    // Handle three different function signatures. The first argument can be a
    // callback, in this case no chunk is provided and we have to pass. In the
    // other two cases the first argument is the chunk.
    if (typeof arg1 === 'function') {
      // No chunk provided, we have to end here.
      _end.call(event.node.res, arg1)
      return
    }

    const chunk = arg1

    // Add CDN headers first if feature is enabled.
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

    const multiCache = getMultiCacheContext(event)

    if (event.path && multiCache && multiCache.route) {
      // Handle route caching.
      const routeHelper = getMultiCacheRouteHelper(event)

      // Set the cache entry if the route is set as cacheable.
      if (routeHelper && routeHelper.cacheable) {
        const multiCache = getMultiCacheContext(event)
        if (multiCache?.route && event.path) {
          const response = event.node.res as ServerResponse
          const headers = response.getHeaders()
          const item: RouteCacheEntry = {
            data: chunk,
            headers,
            statusCode: response.statusCode,
          }
          if (routeHelper.maxAge) {
            item.expires = Math.round(Date.now() / 1000) + routeHelper.maxAge
          }
          if (routeHelper.tags.length) {
            item.cacheTags = routeHelper.tags
          }
          multiCache.route.setItem(event.path, item)
        }
      }
    }

    // Call the original end method.
    _end.call(event.node.res, arg1, arg2, arg3)
  }
})
