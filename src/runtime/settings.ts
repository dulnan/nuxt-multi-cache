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

export const DEFAULT_CACHE_TAG_INVALIDATION_DELAY = 60000
export const DEFAULT_API_PREFIX = '/__nuxt_multi_cache'
export const DEFAULT_CDN_CONTROL_HEADER = 'Surrogate-Control'
export const DEFAULT_CDN_TAG_HEADER = 'Cache-Tag'

export const defaultOptions: Subset<NuxtMultiCacheOptions> = {
  api: {
    prefix: DEFAULT_API_PREFIX,
    cacheTagInvalidationDelay: DEFAULT_CACHE_TAG_INVALIDATION_DELAY,
  },
}
