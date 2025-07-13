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
  enabled: boolean
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

export interface ModuleOptions {
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

  /**
   * Log detailled messages to the console.
   */
  debug?: boolean

  /**
   * Don't log the caching overview.
   */
  disableCacheOverviewLogMessage?: boolean
}
