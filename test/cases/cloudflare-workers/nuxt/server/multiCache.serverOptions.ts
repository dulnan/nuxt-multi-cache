import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import { defineMultiCacheOptions } from './../../../../../src/server-options'

// All caches use the KV namespace bound as "CACHE", each with its own base.
export default defineMultiCacheOptions(() => {
  return {
    route: {
      storage: {
        driver: cloudflareKVBindingDriver({ binding: 'CACHE', base: 'route' }),
      },
    },
    component: {
      storage: {
        driver: cloudflareKVBindingDriver({
          binding: 'CACHE',
          base: 'component',
        }),
      },
    },
    data: {
      storage: {
        driver: cloudflareKVBindingDriver({ binding: 'CACHE', base: 'data' }),
      },
    },
  }
})
