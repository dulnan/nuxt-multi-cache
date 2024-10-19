import { defineMultiCacheOptions } from './../../src/runtime/serverOptions/defineMultiCacheOptions'

export default defineMultiCacheOptions({
  cacheKeyPrefix: (): Promise<string> => {
    return Promise.resolve('MY_CACHE_PREFIX_')
  },
})
