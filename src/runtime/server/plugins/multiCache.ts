import { defineNitroPlugin } from 'nitropack/runtime'
import { createStorage } from 'unstorage'
import { onBeforeResponse } from '../hooks/beforeResponse'
import { onRequest } from '../hooks/request'
import { onAfterResponse } from '../hooks/afterResponse'
import type { MultiCacheApp, NuxtMultiCacheSSRContext } from '../../types'
import { onError } from '../hooks/error'
import { MultiCacheState } from '../../helpers/MultiCacheState'
import { useRuntimeConfig } from '#imports'
import { serverOptions } from '#multi-cache-server-options'

function createMultiCacheApp(): MultiCacheApp {
  const runtimeConfig = useRuntimeConfig()

  const cacheContext: NuxtMultiCacheSSRContext = {}

  // Initialize all enabled caches. Explicit initialization because some
  // caches might need additional configuration options and/or checks.
  if (runtimeConfig.multiCache.component) {
    cacheContext.component = createStorage(serverOptions.component?.storage)
  }
  if (runtimeConfig.multiCache.data) {
    cacheContext.data = createStorage(serverOptions.data?.storage)
  }
  if (runtimeConfig.multiCache.route) {
    cacheContext.route = createStorage(serverOptions.route?.storage)
  }

  return {
    cache: cacheContext,
    serverOptions,
    config: runtimeConfig.multiCache,
    state: new MultiCacheState(),
  }
}

export default defineNitroPlugin((nitroApp) => {
  const multiCache = createMultiCacheApp()
  nitroApp.multiCache = multiCache

  // Adds the context to the event and returns cached routes.
  nitroApp.hooks.hook('request', onRequest)

  // Hook only needed if CDN feature is enabled.
  if (multiCache.config.cdn.enabled) {
    nitroApp.hooks.hook('beforeResponse', onBeforeResponse)
  }

  // We have to add a "fake" event handler as the very first handler in the
  // stack. Since we serve from cache inside the "request" hook (which runs
  // before any event handlers), the response has already been sent at that
  // point. However, H3 will still continue to execute the event handlers
  // and one of them is the "route-rules" handler from Nitro which may set
  // response headers, which will throw an "Cannot set headers after they are
  // sent to the client" error.
  nitroApp.h3App.stack.unshift({
    route: '/',
    handler: function (event) {
      // This is set by our serveCachedRoute method.
      if (event.__MULTI_CACHE_SERVED_FROM_CACHE) {
        // This is never actually sent to the client. It's just a workaround
        // (or more a hack) to tell H3 to stop executing any other event
        // handlers.
        return 'NOOP'
      }
    },
  })

  // Only needed if route caching is enabled.
  if (multiCache.config.route) {
    // Hook into afterResponse to store cacheable responses in cache.
    nitroApp.hooks.hook('afterResponse', onAfterResponse)

    // Hook into the error handler of H3 to try and serve stale cached routes.
    nitroApp.hooks.hook('error', onError)
  }
})
