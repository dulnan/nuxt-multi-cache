import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheKeyPrefix: 'from-layer',
  }
})
