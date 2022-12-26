import type { NitroAppPlugin } from 'nitropack'
import { format as cacheControlFormat } from '@tusbar/cache-control'
import { getMultiCacheRouteContext } from './../helpers/server'

/**
 * Adds the cache headers to the response.
 */
export default <NitroAppPlugin>function (nitroApp) {
  nitroApp.hooks.hook('render:response', (response, ctx) => {
    const routeContext = getMultiCacheRouteContext(ctx.event)

    if (routeContext.tags) {
      response.headers['Surrogate-Key'] = routeContext.tags.join(' ')
    }

    const cacheControl = cacheControlFormat(routeContext.control)
    if (cacheControl) {
      response.headers['Surrogate-Control'] = cacheControl
    }
  })
}
