import type { OutgoingHttpHeaders } from 'node:http'
import type { CreateStorageOptions, Storage } from 'unstorage'
import type { H3Event } from 'h3'
import type { NuxtMultiCacheRouteCacheHelper } from './helpers/RouteCacheHelper'
import type { NuxtMultiCacheCDNHelper } from './helpers/CDNHelper'
import type { MultiCacheState } from './helpers/MultiCacheState'

export type NuxtMultiCacheSSRContextCache = {
  storage: Storage
  bubbleError: boolean
}

export interface NuxtMultiCacheSSRContext {
  /**
   * The component cache instance.
   */
  component?: NuxtMultiCacheSSRContextCache

  /**
   * The data cache instance.
   */
  data?: NuxtMultiCacheSSRContextCache

  /**
   * The route cache instance.
   */
  route?: NuxtMultiCacheSSRContextCache
}

export interface CacheItem {
  data: string
  expires?: number
  cacheTags?: string[]
}

export interface RouteCacheItem extends CacheItem {
  headers: Record<string, any>
  statusCode: number
  staleWhileRevalidate: boolean
  staleIfErrorExpires?: number
}

export interface DataCacheItem extends CacheItem {}

export interface ComponentCacheItem extends CacheItem {
  payload?: Record<string, any>
}

export type ComponentCacheEntry = ComponentCacheItem | string

export type MultiCacheServerOptionsCacheOptions = {
  storage?: CreateStorageOptions
  bubbleError?: boolean
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
}

// This typo went unnoticed for quite some time, so we'll also export it with
// the typo, in case it was imported by module users.
export type MutliCacheServerOptions = MultiCacheServerOptions

export type MultiCacheRuntimeConfig = {
  cdn: {
    enabled: boolean
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

export interface MultiCacheApp {
  /**
   * The cache singleton.
   */
  cache: NuxtMultiCacheSSRContext

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
  export interface H3Event {
    /**
     * The nuxt-multi-cache cache context.
     */
    __MULTI_CACHE?: NuxtMultiCacheSSRContext

    /**
     * The nuxt-multi-cache route cache helper.
     */
    __MULTI_CACHE_ROUTE?: NuxtMultiCacheRouteCacheHelper

    /**
     * The nuxt-multi-cache CDN helper.
     */
    __MULTI_CACHE_CDN?: NuxtMultiCacheCDNHelper

    /**
     * The nuxt-multi-cache global cache prefix that is applied to all caches.
     */
    __MULTI_CACHE_PREFIX?: string

    /**
     * Contains the already fetched cached route, if it exists.
     */
    __MULTI_CACHE_DECODED_CACHED_ROUTE?: RouteCacheItem

    /**
     * The route cache key that is currently being revalidated.
     */
    __MULTI_CACHE_REVALIDATION_KEY?: string

    /**
     * Whether the current request has already been served from cache.
     */
    __MULTI_CACHE_SERVED_FROM_CACHE?: boolean
  }
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
