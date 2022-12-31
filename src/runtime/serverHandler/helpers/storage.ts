import { createStorage } from 'unstorage'
import { NuxtMultiCacheSSRContext } from '../../types'
import { getModuleConfig } from './../helpers'

// Store a single promise to prevent initializing caches multiple times.
let promise: Promise<NuxtMultiCacheSSRContext> | null = null

/**
 * Method to initialize the caches.
 *
 * The method will only initialize it once and return the same promise
 * afterwards.
 */
export function loadCacheContext() {
  if (promise) {
    return promise
  }
  promise = getModuleConfig().then((config) => {
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

    return cacheContext
  })

  return promise
}
