import { createStorage, prefixStorage } from 'unstorage'
import { MultiCacheOptions, NuxtMultiCacheSSRContext } from '../../types'
import { getModuleConfig } from './../helpers'

type CacheKeys = keyof NuxtMultiCacheSSRContext

function createCacheStorage(
  name: keyof NuxtMultiCacheSSRContext,
  config: MultiCacheOptions,
) {
  return prefixStorage(createStorage(config.storage), 'multiCache_' + name)
}

let CACHE_CONTEXT: NuxtMultiCacheSSRContext | null = null
let promise: Promise<NuxtMultiCacheSSRContext> | null = null

export function loadCacheContext() {
  if (promise) {
    return promise
  }
  promise = getModuleConfig().then((moduleConfig) => {
    const cacheContext: NuxtMultiCacheSSRContext = {}
    if (moduleConfig.caches) {
      const cacheKeys: CacheKeys[] = Object.keys(
        moduleConfig.caches,
      ) as CacheKeys[]
      cacheKeys.forEach((key: CacheKeys) => {
        const cacheConfig = moduleConfig.caches?.[key]
        if (cacheConfig && cacheConfig.enabled) {
          cacheContext[key] = createCacheStorage(key, cacheConfig)
        }
      })
    }
    CACHE_CONTEXT = cacheContext
    return CACHE_CONTEXT
  })

  return promise
}
