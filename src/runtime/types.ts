import type { CreateStorageOptions, Storage } from 'unstorage'
import type { H3Event } from 'h3'

interface CacheConfigOptions {
  /**
   * Set if the cache is enabled.
   *
   * While the cache will be disabled during the app's runtime, all the
   * corresponding code (components, composables, etc.) will still be added,
   * even if the value is `false` here. This is so that it's possible to
   * disable caching without having to refactor your code.
   *
   * If you wish to completely disable a feature so that no code is added just
   * leave the entire configuration property undefined.
   */
  enabled?: boolean
}

export type CDNOptions = {
  /**
   * Enable the CDN headers feature.
   */
  enabled: boolean

  /**
   * The header to use for the cache-control settings.
   */
  cacheControlHeader?: string

  /**
   * The header to use for the cache tags header.
   */
  cacheTagHeader?: string
}

export interface NuxtMultiCacheOptions {
  /**
   * Component cache.
   *
   * When enabled you can use the <RenderCacheable> wrapper component to cache
   * the generated markup of its slot children. Each subsequent request will
   * load the markup from cache and bypass rendering entirely.
   *
   * This is generally used for global components like navigation or footer,
   * but it can also be used to cache an entire page when used in a layout
   * component. It also supports caching payloads.
   *
   * The performance improvements are most noticeable if you have complex
   * components and a lot of pages.
   */
  component?: CacheConfigOptions

  /**
   * Generic data cache.
   *
   * Can be used for anything: Caching API responses, expensive calculations,
   * slow external APIs, etc.
   */
  data?: CacheConfigOptions

  /**
   * Route cache.
   *
   * Caches routes based on the path. Works for both rendered Nuxt pages and
   * server API routes.
   */
  route?: CacheConfigOptions

  /**
   * Configuration for the CDN headers feature.
   *
   * This feature allows you to manage special HTTP headers used by
   * Cloudflare, Fastly, Varnish and other caching services. These headers
   * control how long a page should be cached, how long stale cache entries
   * should be served, what the cache tags are, etc.
   *
   * Note that this is fundamentally different to the route cache: This
   * feature only sets response headers, while the route cache actually caches
   * pages.
   *
   * In addition, these headers are never sent to the client. They are
   * intercepted by the CDN/HTTP cache and only used internally.
   *
   * It's possible to use both the CDN feature and the route cache at the same
   * time. Note that they each have independent state; e.g. if you set a max
   * age for the route cache it doesn't affect the max age value for the CDN
   * headers.
   */
  cdn?: CDNOptions

  /**
   * Settings for the API endpoints.
   */
  api?: {
    /**
     * Enable the API endpoints for cache management.
     */
    enabled?: boolean

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
    authorization: string | false

    /**
     * Delay for invalidating cache tags.
     *
     * Since purging by cache tag requires looping over all cache entries this
     * action is debounced. The value (in milliseconds) will be the amount of
     * delay that is used to buffer incoming tag invalidations. The delay is
     * fixed and starts when the first invalidation request comes in, then all
     * requests are added to the buffer. Once the delay is over, the cache
     * entries for all the tags are purged and the timeout is reset.
     */
    cacheTagInvalidationDelay?: number
  }
}

export interface NuxtMultiCacheSSRContext {
  /**
   * The component cache instance.
   */
  component?: Storage

  /**
   * The data cache instance.
   */
  data?: Storage

  /**
   * The route cache instance.
   */
  route?: Storage
}

export interface CacheItem {
  data: string
  expires?: number
  cacheTags?: string[]
}

export interface RouteCacheItem extends CacheItem {
  headers: Record<string, any>
  statusCode: number
}

export interface ComponentCacheItem extends CacheItem {
  payload?: Record<string, any>
}

export type ComponentCacheEntry = ComponentCacheItem | string

export type MutliCacheServerOptions = {
  component?: {
    storage?: CreateStorageOptions
  }
  data?: {
    storage?: CreateStorageOptions
  }
  route?: {
    storage?: CreateStorageOptions

    /**
     * Provide a custom function that builds the cache key for a route.
     */
    buildCacheKey?: (event: H3Event) => string
  }

  /**
   * Determine if caching should be used for the given request.
   *
   * If the method resolves to `false` the cache context singleton is not
   * attached to the request, which prevents getting and setting cache entries
   * for the duration of the request.
   *
   * This does not affect the CDN feature.
   *
   * One use case might be to prevent caching for requests coming from
   * authenticated users to make it impossible to cache sensitive data.
   * Or to offer a quick way to disable caching based on local or remote
   * configuration.
   */
  enabledForRequest?: (event: H3Event) => Promise<boolean>

  /**
   * Define a global cache key prefix.
   *
   * Can be a string or a method that returns a promise that resolves to a
   * string given the H3 request event.
   *
   * This is useful if you have multiple Nuxt instances running on the same
   * code base but with a different global context. For example in a
   * multi-domain setup you might have one instance per domain, but each
   * instance uses the same cache backend (e.g. redis). Setting a global prefix
   * will make sure that each instance is scoped.
   */
  cacheKeyPrefix?: string | ((event: H3Event) => Promise<string>)

  api?: {
    /**
     * The authorization for the API endpoints.
     *
     * should return a Promise that resolves to true or false.
     */
    authorization?: (event: H3Event) => Promise<boolean>
  }
}

export type MultiCacheRuntimeConfig = {
  cdn: {
    cacheControlHeader: string
    cacheTagHeader: string
  }
  component: boolean
  data: boolean
  route: boolean
  api: {
    enabled: boolean
    prefix: string
    cacheTagInvalidationDelay: number
    authorizationToken: string
    authorizationDisabled: boolean
  }
}
