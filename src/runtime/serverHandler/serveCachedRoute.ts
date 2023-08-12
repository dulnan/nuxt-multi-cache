import { defineEventHandler, setResponseHeaders } from 'h3'
import { decodeRouteCacheItem } from '../helpers/cacheItem'
import {
  getMultiCacheContext,
  getCacheKeyWithPrefix,
  encodeRouteCacheKey,
} from './../helpers/server'
import serverOptions from '#multi-cache-server-options'

/**
 * Route cache event handler. Returns a cached response if available.
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
    const fullKey = serverOptions?.route?.buildCacheKey
      ? serverOptions.route.buildCacheKey(event)
      : getCacheKeyWithPrefix(encodeRouteCacheKey(event.path), event)

    const cachedRaw = await multiCache.route.getItemRaw(fullKey)
    if (cachedRaw && typeof cachedRaw === 'string') {
      const decoded = decodeRouteCacheItem(cachedRaw)
      if (decoded) {
        // Check if the item is stale.
        if (decoded.expires) {
          const now = Date.now() / 1000
          if (now >= decoded.expires) {
            return
          }
        }

        if (decoded.headers) {
          setResponseHeaders(event, decoded.headers)
        }
        if (decoded.statusCode) {
          event.node.res.statusCode = decoded.statusCode
        }
        return decoded.data
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      console.debug(e.message)
    }
  }
})
