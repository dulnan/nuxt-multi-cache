import type { CapturedErrorContext } from 'nitropack/types'
import { setCachedResponse } from '../../helpers/routeCache'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import { sendWebResponse } from 'h3'
import { logger } from '../../helpers/multi-cache-logger'
import { getRequestTimestamp } from '../../helpers/server'
import { isExpired } from '../../helpers/maxAge'

/**
 * Whether the error is a server error (5xx).
 *
 * Errors without a status code are unhandled errors, to which h3 responds
 * with a 500.
 */
function isServerError(error: Error): boolean {
  const statusCode = (error as { statusCode?: unknown }).statusCode
  return typeof statusCode !== 'number' || statusCode >= 500
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

    const { state } = getMultiCacheApp()

    if (ctx.event.context.multiCache?.routeRevalidationkey) {
      state.removeKeyBeingRevalidated(
        ctx.event.context.multiCache.routeRevalidationkey,
      )
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

    const response = new Response(decoded.data, {
      headers: decoded.headers,
    })

    // Directly respond with our response.
    // This might potentially lead to other hooks (such as beforeResponse) not
    // being called here that would for example compress the response.
    return sendWebResponse(ctx.event, response)
  } catch (e) {
    logger.warn('Unexpected error in nuxt-multi-cache nitro error handler.', e)
  }
}
