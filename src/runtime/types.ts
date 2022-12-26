import type { CreateStorageOptions, Storage } from 'unstorage'
import type { H3Event } from 'h3'
import type { CacheControl } from '@tusbar/cache-control'

export interface MultiCacheOptions {
  /**
   * Set if the cache is enabled.
   */
  enabled?: boolean

  /**
   * Configuration for the unstorage instance.
   */
  storage?: CreateStorageOptions
}

export interface NuxtMultiCacheHeaderOptions {
  enabled?: boolean
}

export interface NuxtMultiCacheOptions {
  caches?: {
    component?: MultiCacheOptions
    data?: MultiCacheOptions
    route?: MultiCacheOptions
  }
  cacheHeaders?: NuxtMultiCacheHeaderOptions

  /**
   * Settings for the API endpoints.
   */
  api: {
    /**
     * The prefix used for the API endpoints.
     *
     * @default '/__nuxt_multi_cache'
     */
    prefix?: string

    /**
     * The authorization for the API endpoints.
     *
     * If a string is provided, the auth check will be done using the
     * `x-nuxt-multi-cache-token` header.
     *
     * If a function is provided you can implement a custom auth check that
     * should return a Promise that resolves to true or false.
     *
     * If `false` is provided then authorization check is skipped. Only do
     * this if you made sure that the API endpoints are not public, since this
     * can potentially leak sensitive information via cached data or allow
     * anyone to purge cache entries!
     */
    authorization: string | false | ((event: H3Event) => Promise<boolean>)
  }
}

export interface NuxtMultiCacheSSRContext {
  component?: Storage
  data?: Storage
  route?: Storage
}

export interface NuxtMultiCacheRouteContext {
  tags: string[]
  cacheable: boolean | null
  control: CacheControl
}
