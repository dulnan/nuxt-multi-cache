import { defineMultiCacheOptions } from './../../src/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheKeyPrefix: (): Promise<string> => {
      return Promise.resolve('MY_CACHE_PREFIX_')
    },
  }
})
