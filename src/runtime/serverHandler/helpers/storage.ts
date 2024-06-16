import { createStorage } from 'unstorage'
import type { NuxtMultiCacheSSRContext } from './../../types'
import { useRuntimeConfig } from '#imports'
import serverOptions from '#multi-cache-server-options'

let cacheContext: NuxtMultiCacheSSRContext | null = null

/**
 * Method to initialize the caches.
 *
 * The method will only initialize it once and return the same promise
 * afterwards.
 */
export function loadCacheContext() {
  if (!cacheContext) {
    const runtimeConfig = useRuntimeConfig()

    cacheContext = {}

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
  }
  return cacheContext
}
