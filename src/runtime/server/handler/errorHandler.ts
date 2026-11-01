import { sendWebResponse } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime'
import { setCachedResponse } from '../../helpers/routeCache'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { logger } from '../../helpers/multi-cache-logger'
import {
  addCacheStatusHeader,
  appendCacheStatus,
  getCacheStatusName,
  serializeCacheStatus,
} from '../../helpers/cacheStatus'
import {
  getStaleRoute,
  getStaleRouteCacheStatus,
} from '../../helpers/staleIfError'

/**
 * Nitro error handler, added before the error handler of the app (Nuxt's,
 * which renders the error page).
 *
 * Nitro only calls it for errors that become the response, not for errors
 * that are only captured, and awaits it. If it doesn't respond, the next error
 * handler is called.
 */
export default defineNitroErrorHandler(async (error, event) => {
  const app = useMultiCacheApp()
  if (!app) {
    return
  }

  try {
    // h3 doesn't call the afterResponse hook for error responses, which
    // removes the key otherwise.
    const revalidationKey = event.context.multiCache?.routeRevalidationkey
    if (revalidationKey) {
      app.state.removeKeyBeingRevalidated(revalidationKey)
    }

    if (event.handled) {
      return
    }

    // Error responses are sent without the beforeResponse hook, which adds
    // the entry of the route cache to the Cache-Status header otherwise.
    const cacheStatusName = getCacheStatusName(app.config.routeCacheStatus)
    const cacheStatus = event.context.multiCache?.routeCacheStatus
    if (cacheStatusName && cacheStatus) {
      addCacheStatusHeader(event, cacheStatusName, cacheStatus)
    }

    const decoded = getStaleRoute(event, error.statusCode)
    if (!decoded) {
      return
    }

    // h3 has already set the status of the error response. The status code is
    // replaced with the cached one, but the status text has to be reset, so
    // that the default text of the cached status code is sent.
    event.node.res.statusMessage = ''

    setCachedResponse(event, decoded)

    // The headers of the response replace the ones already set.
    const headers = { ...decoded.headers }
    if (cacheStatusName) {
      headers['cache-status'] = appendCacheStatus(
        headers['cache-status'],
        serializeCacheStatus(
          cacheStatusName,
          getStaleRouteCacheStatus(event, decoded, error.statusCode),
        ),
      )
    }

    // Awaited, so that the response has been sent when Nitro checks whether
    // to call the next error handler.
    // The beforeResponse hook is not called for the stale route, so it is
    // not compressed by an app that compresses responses there.
    await sendWebResponse(event, new Response(decoded.data, { headers }))
  } catch (e) {
    logger.warn('Unexpected error in nuxt-multi-cache error handler.', e)
  }
})
