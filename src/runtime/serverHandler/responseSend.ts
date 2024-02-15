import type { ServerResponse } from 'http'
import { defineEventHandler } from 'h3'
import { format } from '@tusbar/cache-control'
import { encodeRouteCacheItem } from '../helpers/cacheItem'
import { logger } from '../helpers/logger'
import {
  getMultiCacheCDNHelper,
  getMultiCacheContext,
  getMultiCacheRouteHelper,
  getCacheKeyWithPrefix,
  encodeRouteCacheKey,
} from './../helpers/server'
import serverOptions from '#multi-cache-server-options'
import { useRuntimeConfig } from '#imports'

/**
 * Route cache event handler.
 *
 * Returns a cached response if available and caches responses if they are
 * marked cacheable.
 */
export default defineEventHandler((event) => {
  const cdnHelper = getMultiCacheCDNHelper(event)
  const multiCache = getMultiCacheContext(event)
  const runtimeConfig = useRuntimeConfig()
  const debug = runtimeConfig.multiCache.debug

  if (!cdnHelper && !multiCache?.route) {
    return
  }

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
      return _end.call(event.node.res, arg1)
    }

    const chunk = arg1

    // Add CDN headers first if feature is enabled.
    if (cdnHelper) {
      const cacheTagsValue = cdnHelper._tags.join(' ')
      if (cacheTagsValue) {
        response.setHeader(
          runtimeConfig.multiCache.cdn.cacheTagHeader,
          cacheTagsValue,
        )
      }

      const cacheControlValue = format(cdnHelper._control)
      if (cacheControlValue) {
        response.setHeader(
          runtimeConfig.multiCache.cdn.cacheControlHeader,
          cacheControlValue,
        )
      }
    }

    if (event.path) {
      // Handle route caching.
      const routeHelper = getMultiCacheRouteHelper(event)

      // Set the cache entry if the route is set as cacheable.
      if (routeHelper && routeHelper.cacheable) {
        const multiCache = getMultiCacheContext(event)
        if (multiCache?.route && event.path) {
          const cacheKey = serverOptions?.route?.buildCacheKey
            ? serverOptions.route.buildCacheKey(event)
            : getCacheKeyWithPrefix(encodeRouteCacheKey(event.path), event)

          const response = event.node.res as ServerResponse
          const expires = routeHelper.maxAge
            ? Math.round(Date.now() / 1000) + routeHelper.maxAge
            : undefined

          const cacheItem = encodeRouteCacheItem(
            chunk,
            response.getHeaders(),
            response.statusCode,
            expires,
            routeHelper.tags,
          )

          if (debug) {
            logger.info('Storing route in cache: ' + event.path, {
              expires,
              cacheTags: routeHelper.tags,
              statusCode: response.statusCode,
            })
          }

          return multiCache.route
            .setItemRaw(cacheKey, cacheItem, { ttl: routeHelper.maxAge })
            .then(() => {
              return _end.call(event.node.res, arg1, arg2, arg3)
            })
        }
      }
    }

    // Call the original end method.
    return _end.call(event.node.res, arg1, arg2, arg3)
  }
})
