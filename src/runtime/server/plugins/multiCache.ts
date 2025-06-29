import { defineNitroPlugin } from 'nitropack/runtime'
import { createStorage } from 'unstorage'
import { onRequest } from '../hooks/request'
import { onAfterResponse } from '../hooks/afterResponse'
import type {
  MultiCacheApp,
  MultiCacheServerOptionsCacheOptions,
  MultiCacheInstances,
  MultiCacheInstance,
} from '../../types'
import { onError } from '../hooks/error'
import { MultiCacheState } from '../../helpers/MultiCacheState'
import { serveCachedHandler } from '../handler/serveCachedRoute'
import { serverOptions } from '#nuxt-multi-cache/server-options'
import { useRuntimeConfig } from '#imports'

function createCacheContext(
  cache: MultiCacheServerOptionsCacheOptions | undefined,
  defaults: Required<Omit<MultiCacheServerOptionsCacheOptions, 'storage'>>,
): MultiCacheInstance {
  return {
    storage: createStorage(cache?.storage),
    bubbleError: cache?.bubbleError ?? defaults.bubbleError,
  }
}

function createMultiCacheApp(): MultiCacheApp {
  const runtimeConfig = useRuntimeConfig()

  const cacheContext: MultiCacheInstances = {}

  // Initialize all enabled caches. Explicit initialization because some
  // caches might need additional configuration options and/or checks.
  if (runtimeConfig.multiCache.component) {
    cacheContext.component = createCacheContext(serverOptions.component, {
      bubbleError: false,
    })
  }

  if (runtimeConfig.multiCache.data) {
    cacheContext.data = createCacheContext(serverOptions.data, {
      bubbleError: true,
    })
  }

  if (runtimeConfig.multiCache.route) {
    cacheContext.route = createCacheContext(serverOptions.route, {
      bubbleError: false,
    })
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

  // Only needed if route caching is enabled.
  if (multiCache.config.route) {
    // Add the handler that may serve cached routes.
    // We have to make sure that this handler is the very first in the array.
    // Using "unshift" is our only option here, but there is no guarantee that
    // during runtime our handler is actually executed first.
    nitroApp.h3App.stack.unshift({
      route: '/',
      handler: serveCachedHandler,
    })

    // Hook into afterResponse to store cacheable responses in cache.
    nitroApp.hooks.hook('afterResponse', onAfterResponse)

    // Hook into the error handler of H3 to try and serve stale cached routes.
    nitroApp.hooks.hook('error', onError)
  }
})
