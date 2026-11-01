import type { RenderContext, RenderResponse } from 'nitropack/types'
import { setCachedResponse } from '../../helpers/routeCache'
import { setRouteCacheStatus } from '../../helpers/cacheStatus'
import {
  getStaleRoute,
  getStaleRouteCacheStatus,
} from '../../helpers/staleIfError'

/**
 * Callback for the 'render:response' nitro hook.
 *
 * With Nuxt's inline error rendering, a page that fails to render responds
 * with the error page instead of throwing, so the error handler isn't called.
 * Nitro awaits this hook before it sends the rendered response, which is
 * replaced with the stale route.
 */
export function onRenderResponse(
  response: Partial<RenderResponse>,
  { event }: RenderContext,
) {
  // Nitro keeps the errors captured during the request. Nuxt captures the
  // error that failed the render with the "ssr" tag.
  const errors: { context: { tags?: string[] } }[] | undefined =
    event.context.nitro?.errors
  const renderFailed = errors?.some((v) => v.context.tags?.includes('ssr'))
  if (!renderFailed || !response.statusCode) {
    return
  }

  const decoded = getStaleRoute(event, response.statusCode)
  if (!decoded) {
    return
  }

  setCachedResponse(event, decoded)

  // Added to the Cache-Status header by the beforeResponse hook.
  setRouteCacheStatus(
    event,
    getStaleRouteCacheStatus(event, decoded, response.statusCode),
  )

  // Nitro sets the status and headers of the response after this hook. The
  // status text is reset, so that the default text of the cached status code
  // is sent.
  event.node.res.statusMessage = ''
  response.statusCode = decoded.statusCode || 200
  response.statusMessage = undefined
  response.headers = { ...decoded.headers }
  response.body = decoded.data
}
