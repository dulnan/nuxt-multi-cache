import {
  getResponseHeaders,
  getResponseStatus,
  type H3Event,
  getRequestURL,
} from 'h3'
import {
  encodeRouteCacheKey,
  getCacheKeyWithPrefix,
  getCacheTagRegistry,
  getMultiCacheContext,
  getMultiCacheRouteHelper,
} from '../../helpers/server'
import { encodeRouteCacheItem } from '../../helpers/cacheItem'
import { logger } from '../../helpers/logger'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { debug } from '#nuxt-multi-cache/config'

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
  } catch (e) {
    logger.error(
      'Error while attempting to stringify response for route cache.',
      e,
    )
  }
}

/**
 * Callback for the 'afterResponse' nitro hook.
 */
export async function onAfterResponse(
  event: H3Event,
  response: { body?: unknown } | undefined,
) {
  // Has already been served from cache, so there is nothing to do here.
  if (event.context?.multiCache?.routeServedFromCache) {
    return
  }

  if (!response?.body) {
    return
  }

  const statusCode = getResponseStatus(event)

  if (statusCode !== 200) {
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

  const responseData = stringify(response.body)

  if (!responseData) {
    return
  }

  const { serverOptions, state } = useMultiCacheApp()

  let responseHeaders = getResponseHeaders(event)

  // We have to remove this header, because what we store in the cache is not
  // encoded. Apps may implement custom encoding that is applied in the
  // beforeResponse hook. However, it is not guaranteed that when serving a
  // cached route the same compression is also being applied again. If we were
  // to always send this header, then the response might be invalid.
  responseHeaders['content-encoding'] = undefined

  if (serverOptions.route?.alterCachedHeaders) {
    responseHeaders = serverOptions.route.alterCachedHeaders(responseHeaders)
  }

  const cacheKey = serverOptions?.route?.buildCacheKey
    ? await serverOptions.route.buildCacheKey(event)
    : await getCacheKeyWithPrefix(encodeRouteCacheKey(event), event)

  const expires = routeHelper.getExpires('maxAge')
  const staleIfErrorExpires = routeHelper.getExpires('staleIfError')
  const staleWhileRevalidate = !!routeHelper.staleWhileRevalidate
  const cacheTags = routeHelper.getTags()

  const cacheItem = encodeRouteCacheItem(
    responseData,
    responseHeaders,
    statusCode,
    expires,
    staleIfErrorExpires,
    staleWhileRevalidate,
    cacheTags,
  )

  if (debug) {
    const url = getRequestURL(event)
    logger.info('Storing route in cache: ' + url.toString(), {
      cacheKey,
      expires,
      staleIfErrorExpires,
      cacheTags,
      staleWhileRevalidate,
      statusCode,
    })
  }

  try {
    await multiCache.route.storage.setItemRaw(cacheKey, cacheItem, {
      ttl: routeHelper.maxAge,
    })
    if (cacheTags.length) {
      const registry = getCacheTagRegistry(event)
      if (registry) {
        await registry.addCacheTags(cacheKey, 'route', cacheTags)
      }
    }
  } catch (e) {
    logger.error(`Failed to store route cache item for path "${event.path}"`, e)

    if (multiCache.route?.bubbleError) {
      throw e
    }
  }

  if (event.context.multiCache?.routeRevalidationkey) {
    state.removeKeyBeingRevalidated(
      event.context.multiCache.routeRevalidationkey,
    )
  }
}
