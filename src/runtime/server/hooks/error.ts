import type { CapturedErrorContext } from 'nitropack/types'
import { setCachedResponse } from '../../helpers/routeCache'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { sendWebResponse } from 'h3'
import { logger } from '../../helpers/logger'
import { getRequestTimestamp } from '../../helpers/server'

/**
 * Callback for the 'error' nitro hook.
 *
 * This is called during any error that happens in an event handler.
 */
export function onError(_error: Error, ctx: CapturedErrorContext) {
  try {
    if (!ctx.event) {
      return
    }

    const { state } = useMultiCacheApp()

    if (ctx.event.context.multiCache?.routeRevalidationkey) {
      state.removeKeyBeingRevalidated(
        ctx.event.context.multiCache.routeRevalidationkey,
      )
    }

    // Get the decoded route cache item. The "request" handler may have already
    // fetched this, so we can reuse it.
    const decoded = ctx.event.context.multiCache?.routeCachedDecoded

    if (!decoded) {
      return
    }

    // Check whether we may serve a stale item for this route.
    if (!decoded.staleIfErrorExpires) {
      return
    }

    // If we reached the expiry date, return.
    const now = getRequestTimestamp(ctx.event)
    if (now >= decoded.staleIfErrorExpires) {
      return
    }

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
