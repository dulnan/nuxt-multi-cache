import { createStorage, prefixStorage } from 'unstorage'
import { getModuleConfig } from './helpers'
import {
  MultiCacheOptions,
  NuxtMultiCacheRouteContext,
  NuxtMultiCacheSSRContext,
} from '../../types'
import {
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
} from '../helpers/server'

type CacheKeys = keyof NuxtMultiCacheSSRContext

function createCacheStorage(
  name: keyof NuxtMultiCacheSSRContext,
  config: MultiCacheOptions,
) {
  return prefixStorage(createStorage(config.storage), 'multiCache_' + name)
}

let CACHE_CONTEXT: NuxtMultiCacheSSRContext | null = null
let promise: Promise<void> | null = null

function initCacheContext() {
  if (promise) {
    return promise
  }
  promise = getModuleConfig().then((moduleConfig) => {
    const cacheContext: NuxtMultiCacheSSRContext = {}
    if (moduleConfig.caches) {
      const cacheKeys: CacheKeys[] = Object.keys(
        moduleConfig.caches,
      ) as CacheKeys[]
      cacheKeys.forEach(async (key: CacheKeys) => {
        const cacheConfig = moduleConfig.caches?.[key]
        if (cacheConfig && cacheConfig.enabled) {
          cacheContext[key] = createCacheStorage(key, cacheConfig)
        }
      })
    }
    CACHE_CONTEXT = cacheContext
  })

  return promise
}

export default defineEventHandler(async (event) => {
  // Init cache context if not already done.
  // Returns a single promise so that we don't initialize it multiple times
  // when multiple requests come in.
  if (!CACHE_CONTEXT) {
    await initCacheContext()
  }

  // Add the cache context object to the SSR context object.
  event.context[MULTI_CACHE_CONTEXT_KEY] = CACHE_CONTEXT

  // Create a route context this request.
  const routeContext: NuxtMultiCacheRouteContext = {
    tags: [],
    cacheable: null,
    maxAge: null,
  }
  event.context[MULTI_CACHE_ROUTE_CONTEXT_KEY] = routeContext
})
