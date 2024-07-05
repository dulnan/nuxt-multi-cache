import { getResponseHeaders, getResponseStatus, type H3Event } from 'h3'
import {
  encodeRouteCacheKey,
  getCacheKeyWithPrefix,
  getMultiCacheContext,
  getMultiCacheRouteHelper,
} from '../../helpers/server'
import { encodeRouteCacheItem } from '../../helpers/cacheItem'
import { logger } from '../../helpers/logger'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { useRuntimeConfig } from '#imports'

/**
 * Callback for the 'afterResponse' nitro hook.
 */
export async function onAfterResponse(
  event: H3Event,
  response: { body?: unknown } | undefined,
) {
  if (!response?.body || typeof response.body !== 'string') {
    return
  }

  const multiCache = getMultiCacheContext(event)
  if (!multiCache?.route) {
    return
  }

  const routeHelper = getMultiCacheRouteHelper(event)
  if (!routeHelper?.cacheable) {
    return
  }

  const statusCode = getResponseStatus(event)

  if (statusCode !== 200) {
    return
  }

  const { serverOptions } = useMultiCacheApp()

  let responseHeaders = getResponseHeaders(event)

  if (serverOptions.route?.alterCachedHeaders) {
    responseHeaders = serverOptions.route.alterCachedHeaders(responseHeaders)
  }

  const cacheKey = serverOptions?.route?.buildCacheKey
    ? serverOptions.route.buildCacheKey(event)
    : getCacheKeyWithPrefix(encodeRouteCacheKey(event.path), event)

  const expires = routeHelper.maxAge
    ? Math.round(Date.now() / 1000) + routeHelper.maxAge
    : undefined

  const cacheItem = encodeRouteCacheItem(
    response.body,
    responseHeaders,
    statusCode,
    expires,
    routeHelper.tags,
  )

  const debugEnabled = useRuntimeConfig().multiCache.debug

  if (debugEnabled) {
    logger.info('Storing route in cache: ' + event.path, {
      cacheKey,
      expires,
      cacheTags: routeHelper.tags,
      statusCode,
    })
  }

  await multiCache.route.setItemRaw(cacheKey, cacheItem, {
    ttl: routeHelper.maxAge,
  })
}
