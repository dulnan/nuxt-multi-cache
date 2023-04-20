import { createStorage } from 'unstorage'
import type { NuxtMultiCacheSSRContext } from './../../types'
import { getModuleConfig } from './../helpers'

// Store a single promise to prevent initializing caches multiple times.
let promise: Promise<NuxtMultiCacheSSRContext> | null = null

/**
 * Method to initialize the caches.
 *
 * The method will only initialize it once and return the same promise
 * afterwards.
 */
export function loadCacheContext(event) {
  if (promise) {
    return promise
  }
  promise = getModuleConfig().then(async (config) => {
    const cacheContext: NuxtMultiCacheSSRContext = {}

    // Initialize all enabled caches. Explicit initialization because some
    // caches might need additional configuration options and/or checks.
    if (config.component && config.component.enabled) {
      cacheContext.component = createStorage(config.component.storage)
    }
    if (config.data && config.data.enabled) {
      cacheContext.data = createStorage(config.data.storage)
    }
    if (config.route && config.route.enabled) {
      cacheContext.route = createStorage(config.route.storage)
    }

    if (config.cacheKeyPrefix && typeof config.cacheKeyPrefix === 'string') {
      //  initialize cacheKeyPrefix only if a constant string, otherwise it must be set for each request
      cacheContext.cacheKeyPrefix = config.cacheKeyPrefix
    }

    return cacheContext
  })

  return promise
}
