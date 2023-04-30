import { createStorage } from 'unstorage'
import type { NuxtMultiCacheSSRContext } from './../../types'
import { useRuntimeConfig } from '#imports'
import serverOptions from '#multi-cache-server-options'

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
if (
  serverOptions.cacheKeyPrefix &&
  typeof serverOptions.cacheKeyPrefix === 'string'
) {
  // Initialize cacheKeyPrefix only if a constant string, otherwise it must be
  // set for each request.
  cacheContext.cacheKeyPrefix = serverOptions.cacheKeyPrefix
}

/**
 * Method to initialize the caches.
 *
 * The method will only initialize it once and return the same promise
 * afterwards.
 */
export function loadCacheContext() {
  return cacheContext
}
