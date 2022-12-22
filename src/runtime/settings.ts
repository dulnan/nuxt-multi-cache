import { NuxtMultiCacheOptions } from '../types'

export const defaultOptions: Partial<NuxtMultiCacheOptions> = {
  caches: {
    component: {
      enabled: true,
    },
  },
  api: {
    prefix: '/__nuxt_multi_cache',
  },
}
