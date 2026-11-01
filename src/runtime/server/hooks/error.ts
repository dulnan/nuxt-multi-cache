import type { CapturedErrorContext } from 'nitropack/types'
import { setCachedResponse } from '../../helpers/routeCache'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import { sendWebResponse } from 'h3'
import { logger } from '../../helpers/multi-cache-logger'
import { getRequestTimestamp } from '../../helpers/server'
import { isExpired } from '../../helpers/maxAge'
import {
  addCacheStatusHeader,
  appendCacheStatus,
  getCacheStatusName,
  getCacheStatusTtl,
  serializeCacheStatus,
} from '../../helpers/cacheStatus'

/**
 * The status code of the error response.
 *
 * Errors without a status code are unhandled errors, to which h3 responds
 * with a 500.
 */
function getErrorStatusCode(error: Error): number {
  const statusCode = (error as { statusCode?: unknown }).statusCode
  return typeof statusCode === 'number' ? statusCode : 500
}

/**
 * Whether the error is a server error (5xx).
 */
function isServerError(error: Error): boolean {
  return getErrorStatusCode(error) >= 500
}

/**
 * Callback for the 'error' nitro hook.
 *
 * This is called during any error that happens in an event handler.
 */
export function onError(error: Error, ctx: CapturedErrorContext) {
  try {
    if (!ctx.event) {
      return
    }

    const { state, config } = getMultiCacheApp()

    if (ctx.event.context.multiCache?.routeRevalidationkey) {
      state.removeKeyBeingRevalidated(
        ctx.event.context.multiCache.routeRevalidationkey,
      )
    }

    // Error responses are sent without the beforeResponse hook, which adds
    // the entry of the route cache to the Cache-Status header otherwise.
    const cacheStatusName = getCacheStatusName(config.routeCacheStatus)
    const cacheStatus = ctx.event.context.multiCache?.routeCacheStatus
    if (cacheStatusName && cacheStatus) {
      addCacheStatusHeader(ctx.event, cacheStatusName, cacheStatus)
    }

    // Like the stale-if-error directive in HTTP, only server errors serve a
    // stale route. A client error, such as a 404 for deleted content, must
    // reach the client.
    if (!isServerError(error)) {
      return
    }

    // Get the decoded route cache item. The "request" handler may have already
    // fetched this, so we can reuse it.
    const decoded = ctx.event.context.multiCache?.routeCachedDecoded

    if (!decoded) {
      return
    }

    // Check whether we may serve a stale item for this route: It must have a
    // stale-if-error that is permanent (-1) or not yet expired.
    if (
      !decoded.staleIfErrorExpires ||
      isExpired(decoded.staleIfErrorExpires, getRequestTimestamp(ctx.event))
    ) {
      return
    }

    // h3 has already set the status of the error response. The status code is
    // replaced with the cached one, but the status text has to be reset, so
    // that the default text of the cached status code is sent.
    ctx.event.node.res.statusMessage = ''

    setCachedResponse(ctx.event, decoded)

    // The headers of the response replace the ones already set.
    const headers = { ...decoded.headers }
    if (cacheStatusName) {
      headers['cache-status'] = appendCacheStatus(
        headers['cache-status'],
        serializeCacheStatus(cacheStatusName, {
          fwd: 'stale',
          fwdStatus: getErrorStatusCode(error),
          ttl: getCacheStatusTtl(
            decoded.expires,
            getRequestTimestamp(ctx.event),
          ),
        }),
      )
    }

    const response = new Response(decoded.data, { headers })

    // Directly respond with our response.
    // This might potentially lead to other hooks (such as beforeResponse) not
    // being called here that would for example compress the response.
    return sendWebResponse(ctx.event, response)
  } catch (e) {
    logger.warn('Unexpected error in nuxt-multi-cache nitro error handler.', e)
  }
}
