import { NuxtMultiCacheOptions } from './types'

type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends object | null
    ? Subset<K[attr]> | null
    : K[attr] extends object | null | undefined
    ? Subset<K[attr]> | null | undefined
    : K[attr]
}

export const defaultOptions: Subset<NuxtMultiCacheOptions> = {
  caches: {
    component: {
      enabled: true,
    },
  },
  api: {
    prefix: '/__nuxt_multi_cache',
  },
}
