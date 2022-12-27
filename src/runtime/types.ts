import type { CreateStorageOptions, Storage } from 'unstorage'
import type { H3Event } from 'h3'
import type { CacheControl } from '@tusbar/cache-control'

export interface MultiCacheOptions {
  /**
   * Set if the cache is enabled.
   *
   * While the cache will be disabled, all the corresponding code (components,
   * composables, etc.) will still be added.
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

export type NuxtMultiCacheCDNHeadersOptions = {
  /**
   * Enable the CDN headers feature.
   */
  enabled: boolean

  /**
   * The header to use for the cache-control settings.
   *
   * For cloudflare this is `cdn-cache-control`. Fastly uses
   * `surrogate-control`.
   */
  cacheControlHeader?: string

  /**
   * The header to use for the cache tags header.
   *
   * Cloudflare: Cache-Tag
   * Fastly: Surrogate-Key
   */
  cacheTagHeader?: string
}

export interface NuxtMultiCacheOptions {
  caches?: {
    /**
     * Component cache.
     */
    component?: MultiCacheOptions | false

    /**
     * Generic data cache.
     */
    data?: MultiCacheOptions | false

    /**
     * Route cache.
     */
    route?: MultiCacheOptions | false
  }

  /**
   * Configuration for the CDN headers feature.
   *
   * This feature allows you to manage special HTTP headers used by
   * Cloudflare, Fastly and other caching services. These headers control how
   * long a page should be cached, how long stale cache entries should be
   * served, etc.
   */
  cdnHeaders?: NuxtMultiCacheCDNHeadersOptions

  /**
   * Determine if caching should be used for the given request.
   *
   * If the method resolves to `false` the cache context singleton is not
   * attached to the request, which prevents getting and setting cache entries
   * for the duration of the request.
   *
   * One use case might be to prevent caching for requests coming from
   * authenticated users.
   */
  enabledForRequest?: (event: H3Event) => Promise<boolean>

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

    /**
     * Delay for invalidating cache tags.
     *
     * Since purging by cache tag requires looping over all cache entries this
     * action is debounced. The value (in milliseconds) will be the amount of
     * delay that is used to buffer incoming tag invalidations. The delay is
     * fixed and starts when the first invalidation request comes in, then all
     * requests are added to the buffer. Once the delay is over, the cache
     * entries for all the tags are purged.
     */
    cacheTagInvalidationDelay?: number
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
