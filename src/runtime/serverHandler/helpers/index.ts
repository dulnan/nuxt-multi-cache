import { defu } from 'defu'
import { loadNuxtConfig } from '@nuxt/kit'
import { defaultOptions } from '../../settings'
import type { NuxtMultiCacheOptions } from './../../types'
import { useRuntimeConfig } from '#imports'

let moduleConfig: NuxtMultiCacheOptions | null = null

/**
 * Due to nuxt's architecture, we have to manually load the runtime configuration.
 * This is only done for the first time and we cache the config locally.
 */
export function getModuleConfig(): Promise<NuxtMultiCacheOptions> {
  // Already loaded, return it.
  if (moduleConfig) {
    return Promise.resolve(moduleConfig)
  }

  // Load the configuration.
  const { multiCache } = useRuntimeConfig()
  return loadNuxtConfig({
    cwd: multiCache.rootDir,
  }).then((v: any) => {
    moduleConfig = defu({}, v.multiCache, defaultOptions)
    return moduleConfig
  })
}
