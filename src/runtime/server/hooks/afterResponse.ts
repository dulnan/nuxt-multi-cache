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

function isPureObject(value: any) {
  const proto = Object.getPrototypeOf(value)
  // eslint-disable-next-line no-prototype-builtins
  return !proto || proto.isPrototypeOf(Object)
}

/**
 * Try to stringify the response.
 */
function stringify(value: any): string | undefined {
  if (typeof value === 'string') {
    return value
  }

  try {
    if (isPureObject(value) || Array.isArray(value)) {
      return JSON.stringify(value)
    }

    if (typeof value.toJSON === 'function') {
      return stringify(value.toJSON())
    }
  } catch (_e) {}
}

/**
 * Callback for the 'afterResponse' nitro hook.
 */
export async function onAfterResponse(
  event: H3Event,
  response: { body?: unknown } | undefined,
) {
  if (!response?.body) {
    return
  }

  const responseData = stringify(response.body)

  if (!responseData) {
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

  const { serverOptions, state } = useMultiCacheApp()

  let responseHeaders = getResponseHeaders(event)

  if (serverOptions.route?.alterCachedHeaders) {
    responseHeaders = serverOptions.route.alterCachedHeaders(responseHeaders)
  }

  const cacheKey = serverOptions?.route?.buildCacheKey
    ? serverOptions.route.buildCacheKey(event)
    : getCacheKeyWithPrefix(encodeRouteCacheKey(event.path), event)

  const expires = routeHelper.getExpires('maxAge')
  const staleIfErrorExpires = routeHelper.getExpires('staleIfError')
  const staleWhileRevalidate = !!routeHelper.staleWhileRevalidate

  const cacheItem = encodeRouteCacheItem(
    responseData,
    responseHeaders,
    statusCode,
    expires,
    staleIfErrorExpires,
    staleWhileRevalidate,
    routeHelper.tags,
  )

  const debugEnabled = useRuntimeConfig().multiCache.debug

  if (debugEnabled) {
    logger.info('Storing route in cache: ' + event.path, {
      cacheKey,
      expires,
      staleIfErrorExpires,
      cacheTags: routeHelper.tags,
      staleWhileRevalidate,
      statusCode,
    })
  }

  await multiCache.route.setItemRaw(cacheKey, cacheItem, {
    ttl: routeHelper.maxAge,
  })

  if (event.context.__MULTI_CACHE_REVALIDATION_KEY) {
    state.removeKeyBeingRevalidated(
      event.context.__MULTI_CACHE_REVALIDATION_KEY,
    )
  }
}
