import type { OutgoingHttpHeaders } from 'node:http'
import type { CreateStorageOptions, Storage } from 'unstorage'
import type { H3Event } from 'h3'
import type { NuxtMultiCacheRouteCacheHelper } from './helpers/RouteCacheHelper'
import type { NuxtMultiCacheCDNHelper } from './helpers/CDNHelper'
import type { MultiCacheState } from './helpers/MultiCacheState'
import type { MaxAge } from './helpers/maxAge'
import type { CacheTagInvalidator } from './helpers/CacheTagInvalidator'

export type BubbleCacheability = boolean | 'route' | 'cdn'

export type CacheType = 'route' | 'data' | 'component'

export type MultiCacheInstance = {
  storage: Storage
  bubbleError: boolean
}

export interface MultiCacheInstances {
  /**
   * The component cache instance.
   */
  component?: MultiCacheInstance

  /**
   * The data cache instance.
   */
  data?: MultiCacheInstance

  /**
   * The route cache instance.
   */
  route?: MultiCacheInstance
}

export interface CacheItem {
  data: string
  expires: number
  staleIfErrorExpires: number
  cacheTags?: string[]
}

export interface CacheableItemInterface {
  expires?: number | null
  staleIfErrorExpires?: number | null
  cacheTags?: string[]
}

export interface RouteCacheItem extends CacheItem {
  headers: Record<string, any>
  statusCode: number
  staleWhileRevalidate: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DataCacheItem extends CacheItem {}

export interface ComponentCacheItem extends CacheItem {
  payload?: Record<string, any>
  ssrModules?: string[]
}

export type ComponentCacheEntry = ComponentCacheItem | string

export type MultiCacheServerOptionsCacheOptions = {
  storage?: CreateStorageOptions
  bubbleError?: boolean
}

export type CacheTagRegistry = {
  /**
   * Return which cache item keys to invalidate for the given cache tags.
   *
   * @param tags - The cache tags that will be invalidated.
   *
   * @returns An object with the cache types as properties and the cache item
   * keys as values.
   *
   * @example
   * ```
   * {
   *   data: ['load-users:de', 'global-config'],
   *   component: ['PageFooter::anonymous:de', 'HeroTeaser::38d38ac58'],
   *   route: ['de--products--583'],
   * }
   * ```
   */
  getCacheKeysForTags(
    tags: string[],
  ): Promise<Partial<Record<CacheType, string[]>>>

  /**
   * Removes the given cache tags from the registry.
   *
   * The method is called after getCacheKeysForTags() when the tags have
   * been successfully invalidated.
   */
  removeTags(tags: string[]): Promise<void>

  /**
   * Remove all item keys of the given cache type.
   *
   * Called when a single cache is purged.
   */
  purgeCache(cacheType: CacheType): Promise<void>

  /**
   * Remove all item keys.
   *
   * Called when all caches are purged.
   */
  purgeEverything(): Promise<void>

  /**
   * Remove a cache item.
   */
  removeCacheItem(cacheType: CacheType, key: string | string[]): Promise<void>

  /**
   * Assign one or more cache tags to the given cache item key.
   */
  addCacheTags(
    cacheItemKey: string,
    cacheType: CacheType,
    cacheTags: string[],
  ): Promise<void>
}

export type MultiCacheServerOptionsRouteCacheOptions =
  MultiCacheServerOptionsCacheOptions & {
    /**
     * Provide a custom function that builds the cache key for a route.
     */
    buildCacheKey?: (event: H3Event) => string | Promise<string>

    /**
     * Alter the headers that are stored in the cache.
     *
     * You can use this to prevent certain headers from ever being cached,
     * such as Set-Cookie.
     */
    alterCachedHeaders?: (
      headers: OutgoingHttpHeaders,
    ) => OutgoingHttpHeaders | Record<string, any>

    /**
     * A function to determine whether route caching is potentially possible.
     *
     * In order to minimize the number of calls to get routes from the cache,
     * it makes sense to already exclude certain paths, such as `/_nuxt` or static assets like .css, .js, .png, .jpg, etc.
     */
    applies?: (path: string) => boolean
  }

export type MultiCacheServerOptions = {
  component?: MultiCacheServerOptionsCacheOptions
  data?: MultiCacheServerOptionsCacheOptions
  route?: MultiCacheServerOptionsRouteCacheOptions

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

  /**
   * Define a "cache tag" registry.
   *
   * The job of the registry is to provide a fast and performant way to look up
   * which cache items to purge when one or more cache tags are invalidated.
   *
   * By default, the cache tag invalidation mechanism is very inefficient, as
   * it has to iterate over all cache items and read their cache tags, in order
   * to "know" which cache items to delete.
   *
   * By providing a cache tag registry, you can greatly improve performance,
   * especially when a lot of cache tags are being invalidated regularly.
   *
   * If 'in-memory' is set, the built-in cache tag registry is used that stores
   * the data in memory. Note that this is *not* compatible when running
   * multiple instances of the same app or when using external caches such as
   * valkey or memcache, since these caches persist across app restarts,
   * whereas the in-memory cache registry is "gone" after a restart.
   */
  cacheTagRegistry?: CacheTagRegistry | 'in-memory'
}

// This typo went unnoticed for quite some time, so we'll also export it with
// the typo, in case it was imported by module users.
export type MutliCacheServerOptions = MultiCacheServerOptions

export type MultiCacheRuntimeConfig = {
  /**
   * Whether CDN headers are enabled.
   */
  cdn: boolean

  /**
   * Whether component caching is enabled.
   */
  component: boolean

  /**
   * Whether data caching is enabled.
   */
  data: boolean

  /**
   * Whether route caching is enabled.
   */
  route: boolean

  /**
   * API settings.
   */
  api: {
    enabled: boolean
    authorizationToken: string
    authorizationDisabled: boolean
  }
}

export interface MultiCacheApp {
  /**
   * The cache singleton.
   */
  cache: MultiCacheInstances

  /**
   * The server options.
   */
  serverOptions: MultiCacheServerOptions

  /**
   * The runtime configuration.
   */
  config: MultiCacheRuntimeConfig

  /**
   * The state.
   */
  state: MultiCacheState

  /**
   * The cache tag registry.
   */
  cacheTagRegistry: CacheTagRegistry | null

  /**
   * The debounced cache tag invalidator.
   */
  cacheTagInvalidator: CacheTagInvalidator
}

export type CacheStatsResponse<T> = {
  status: 'OK'
  rows: { key: string; data: T }[]
  total: number
}

export type CachePurgeItemResponse = {
  status: 'OK'
  affectedKeys: string[]
}

export type CachePurgeAllResponse = {
  status: 'OK'
}

export type CachePurgeTagsResponse = {
  status: 'OK'
  tags: string[]
}

export type DataCacheAddToCacheMethod<T> = (
  data: T,
  tags?: string[],
  maxAge?: MaxAge,
  staleIfError?: MaxAge,
) => Promise<void>

export type DataCacheCallbackContext<T> = {
  /**
   * Add the given item to the cache.
   */
  addToCache: DataCacheAddToCacheMethod<T>

  /**
   * The cached value if not expired.
   */
  value?: T

  /**
   * Contains the stale value, even if it's expired.
   */
  staleValue?: T

  /**
   * The cache tags.
   */
  cacheTags: string[]

  /**
   * The timestamp when the item will expire.
   */
  expires?: number

  /**
   * The timestamp when the item's "staleIfError" will expire.
   */
  staleIfErrorExpires?: number
}

export type MultiCacheEventContext = {
  /**
   * The global prefix for all caches.
   */
  cachePrefix?: string | null

  /**
   * The request timestamp.
   */
  requestTimestamp?: number | null

  /**
   * Whether *any* caching is enabled for the current request.
   */
  enabledForRequest?: boolean

  /**
   * Whether the current request has already been served from cache.
   */
  routeServedFromCache?: boolean

  /**
   * The route cache key that is currently being revalidated.
   */
  routeRevalidationkey?: string

  /**
   * Contains the already fetched cached route, if it exists.
   */
  routeCachedDecoded?: RouteCacheItem

  /**
   * Whether this request originates from within the Nuxt app during SSR.
   */
  isInternalServerRequest?: boolean

  /**
   * The nuxt-multi-cache CDN helper.
   */
  cdn?: NuxtMultiCacheCDNHelper

  /**
   * The route cache helper.
   */
  route?: NuxtMultiCacheRouteCacheHelper
}

declare module 'nitropack/types' {
  export interface NitroApp {
    /**
     * The nuxt-multi-cache cache context.
     */
    multiCache: MultiCacheApp
  }
}

declare module 'h3' {
  export interface H3EventContext {
    multiCache?: MultiCacheEventContext
    multiCacheApp?: MultiCacheApp
  }
}
