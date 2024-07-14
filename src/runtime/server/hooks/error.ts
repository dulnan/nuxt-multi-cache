import type { CapturedErrorContext } from 'nitropack/types'
import { serveCachedRoute } from '../../helpers/routeCache'

/**
 * Callback for the 'beforeResponse' nitro hook.
 *
 * This is called after a valid response was built, but before it is sent.
 */
export function onError(_error: Error, ctx: CapturedErrorContext) {
  try {
    if (!ctx.event) {
      return
    }
    // Get the decoded route cache item. The "request" handler may have already fetched this, so we can reuse it.
    const decoded = ctx.event.context.__MULTI_CACHE_DECODED_CACHED_ROUTE

    if (!decoded) {
      return
    }

    // Check whether we may serve a stale item for this route.
    if (!decoded.staleIfErrorExpires) {
      return
    }

    const now = Date.now() / 1000
    if (now >= decoded.staleIfErrorExpires) {
      return
    }

    serveCachedRoute(ctx.event, decoded)
  } catch (_e) {}
}
