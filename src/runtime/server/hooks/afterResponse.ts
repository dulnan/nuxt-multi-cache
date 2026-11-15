import {
  getResponseHeaders,
  getResponseStatus,
  type H3Event,
  getRequestURL,
} from 'h3'
import {
  getCacheTagRegistry,
  getMultiCacheContext,
  getMultiCacheRouteHelper,
  getRequestTimestamp,
  isValidCacheKey,
} from '../../helpers/server'
import {
  CACHE_NEVER,
  CACHE_PERMANENT,
  getStorageTtl,
} from '../../helpers/maxAge'
import { getRouteCacheKey, isRouteCacheMethod } from '../../helpers/routeCache'
import { encodeRouteCacheItem } from '../../helpers/cacheItem'
import { logger } from '../../helpers/multi-cache-logger'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import { debug } from '#nuxt-multi-cache/config'
import { INTERNAL_RESPONSE_HEADERS } from '../../helpers/constants'

function isPureObject(value: any) {
  const proto = Object.getPrototypeOf(value)
  // oxlint-disable-next-line no-prototype-builtins
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
 * The values of the route cache item for the response, or undefined if the
 * response is not stored.
 */
export function getStorableRoute(
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

  // Internal requests with other methods (e.g. POST) have the route helper
  // only to pass their route cache values to the page.
  if (!isRouteCacheMethod(event)) {
    return
  }

  const routeHelper = getMultiCacheRouteHelper(event)
  if (!routeHelper?.cacheable) {
    return
  }

  const expires = routeHelper.getExpires('maxAge') ?? CACHE_PERMANENT
  const staleIfErrorExpires =
    routeHelper.getExpires('staleIfError') ?? CACHE_NEVER
  const staleWhileRevalidate = !!routeHelper.staleWhileRevalidate
  const ttl = getStorageTtl(
    { expires, staleIfErrorExpires, staleWhileRevalidate },
    getRequestTimestamp(event),
  )

  // Items that can never be served (e.g. a max age of 0 without
  // stale-if-error) are not stored.
  if (ttl === CACHE_NEVER) {
    return
  }

  // Only strings and data that can be serialized as JSON are stored, e.g. not
  // streams.
  const data = stringify(response.body)
  if (!data) {
    return
  }

  return {
    cache: multiCache.route,
    data,
    statusCode,
    expires,
    staleIfErrorExpires,
    staleWhileRevalidate,
    cacheTags: routeHelper.getTags(),
    ttl,
  }
}

/**
 * Store the response in the route cache, if it's cacheable.
 */
async function storeResponse(
  event: H3Event,
  response: { body?: unknown } | undefined,
) {
  const storable = getStorableRoute(event, response)
  if (!storable) {
    return
  }

  const { serverOptions } = getMultiCacheApp()

  // A copy, because for internal requests (e.g. from the Nuxt app during SSR)
  // this can be the actual headers object of the response.
  let responseHeaders = { ...getResponseHeaders(event) }

  // We have to remove this header, because what we store in the cache is not
  // encoded. Apps may implement custom encoding that is applied in the
  // beforeResponse hook. However, it is not guaranteed that when serving a
  // cached route the same compression is also being applied again. If we were
  // to always send this header, then the response might be invalid.
  responseHeaders['content-encoding'] = undefined

  // Internal headers must not be served to other requests from the cache.
  for (const header of INTERNAL_RESPONSE_HEADERS) {
    responseHeaders[header] = undefined
  }

  // The entry of the route cache in the Cache-Status header only describes
  // this response. Entries of other caches, e.g. of a proxied API, are kept.
  const cacheStatus = event.context.multiCache?.routeCacheStatusHeader
  if (cacheStatus && responseHeaders['cache-status'] === cacheStatus.value) {
    responseHeaders['cache-status'] = cacheStatus.before
  }

  if (serverOptions.route?.alterCachedHeaders) {
    responseHeaders = serverOptions.route.alterCachedHeaders(responseHeaders)
  }

  const cacheKey = await getRouteCacheKey(event)
  if (!isValidCacheKey(cacheKey, 'route')) {
    return
  }

  const {
    cache,
    data,
    statusCode,
    expires,
    staleIfErrorExpires,
    staleWhileRevalidate,
    cacheTags,
    ttl,
  } = storable

  const cacheItem = encodeRouteCacheItem(
    data,
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
      ttl,
    })
  }

  try {
    await cache.storage.setItemRaw(cacheKey, cacheItem, { ttl })
    if (cacheTags.length) {
      const registry = getCacheTagRegistry(event)
      if (registry) {
        await registry.addCacheTags(cacheKey, 'route', cacheTags)
      }
    }
  } catch (e) {
    logger.error(`Failed to store route cache item for path "${event.path}"`, e)

    if (cache.bubbleError) {
      throw e
    }
  }
}

/**
 * Callback for the 'afterResponse' nitro hook.
 */
export async function onAfterResponse(
  event: H3Event,
  response: { body?: unknown } | undefined,
) {
  try {
    await storeResponse(event, response)
  } finally {
    // If this request revalidated a stale route, it's no longer being
    // revalidated. This must also happen when the response was not stored
    // (e.g. a status other than 200, or not cacheable), or else the stale
    // route would be served until it's purged.
    const revalidationKey = event.context?.multiCache?.routeRevalidationkey
    if (revalidationKey) {
      getMultiCacheApp().state.removeKeyBeingRevalidated(revalidationKey)
    }

    // Requests waiting for this render now find the stored route.
    event.context?.multiCache?.routeEndRender?.()
  }
}
