import { useRuntimeConfig } from 'nitropack/runtime'
import { defineMultiCacheOptions } from './../../../../../src/server-options'

const counter = globalThis as { serverOptionsCalls?: number }

export default defineMultiCacheOptions(() => {
  // Every build that contains this file creates the server options.
  counter.serverOptionsCalls = (counter.serverOptionsCalls ?? 0) + 1

  const config = useRuntimeConfig()
  return {
    cacheKeyPrefix: String(config.cacheKeyPrefix),
  }
})
