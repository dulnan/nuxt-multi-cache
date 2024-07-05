import { defineNitroPlugin } from 'nitropack/runtime'
import { createStorage } from 'unstorage'
import { onBeforeResponse } from '../hooks/beforeResponse'
import { onRequest } from '../hooks/request'
import { onAfterResponse } from '../hooks/afterResponse'
import type { MultiCacheApp, NuxtMultiCacheSSRContext } from '../../types'
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

  // Hook only needed if route caching is enabled.
  if (multiCache.config.route) {
    nitroApp.hooks.hook('afterResponse', onAfterResponse)
  }
})
