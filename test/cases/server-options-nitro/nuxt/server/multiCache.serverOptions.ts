import { useRuntimeConfig } from 'nitropack/runtime'
import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions(() => {
  const config = useRuntimeConfig()
  return {
    cacheKeyPrefix: String(config.cacheKeyPrefix),
  }
})
