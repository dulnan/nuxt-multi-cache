import { ServerAuthMethod, ServerAuthCredentials } from './ServerMiddleware'
import { Context } from '@nuxt/types'
import { Options as LRUOptions } from 'lru-cache'
import { LRUCacheEntry } from './Cache/LRUCache'

export enum PageCacheMode {
  Static = 'static',
  Memory = 'memory',
}

export type GetCacheKeyMethod = (route: string, context: Context) => string | void

export interface MultiCacheConfig {
  /**
   * Enable the module globally.
   *
   * Even if disabled, the module will attach the helper plugin, but won't do
   * anything besides that.
   */
  enabled: boolean

  /**
   * Logs helpful debugging messages to the console.
   */
  debug?: boolean

  /**
   * Folder where cache modules can write state.
   */
  outputDir: string

  /**
   * Enable the page cache.
   *
   * This will save every cached page to the specified location, preserving URL
   * structure and mapping them to folders and file names. Use this to serve
   * cached routes directly from Apache, nginx or any web server.
   */
  pageCache?: {
    /**
     * Enable page caching.
     */
    enabled: boolean

    /**
     * Set the mode for the page cache.
     */
    mode: PageCacheMode

    /**
     * Determine the unique cache key for a route.
     *
     * This can be used to rewrite how the route is identified in the caching
     * process. For example, if you rely on query parameters for a route, you can
     * rewrite them like this:
     * /search?query=foo%20bar  => /search--query=foo__bar
     * This will allow you to cache routes depending on the query parameter and
     * then serve these from your webserver, if configured properly.
     */
    getCacheKey?: (route: string, context: Context) => string | void

    /**
     * Options passed to the lru cache for components.
     */
    lruOptions?: LRUOptions<string, LRUCacheEntry>
  }

  /**
   * Authenticate a server request.
   *
   * Provide an object with username and password properties to authenticate
   * using basic auth.
   * If you provide a function, you can perform the authentication yourself.
   * The function receives the request as an argument and should return a
   * boolean.
   */
  server: {
    auth: ServerAuthMethod | ServerAuthCredentials
    path?: string
  }

  /**
   * A method to decide if a request should be considered for caching at all.
   *
   * The default method returns true for every route.
   *
   * Returning true does not automatically cache all pages. It's still
   * required to call app.$cache.route.setCacheable().
   *
   * Returning false here prevents anything to be cached during this request.
   * You can use this to prevent sensitive data to be cached and potentially
   * accessible by anyone.
   *
   * Calling setCacheable() will not make it cacheable.
   */
  enabledForRequest?: (req: any, route: string) => boolean

  /**
   * Configuration for the component cache.
   */
  componentCache?: {
    /**
     * Enable component caching.
     */
    enabled: boolean

    /**
     * Options passed to the lru cache for components.
     */
    lruOptions?: LRUOptions<string, LRUCacheEntry>
  }

  /**
   * Configuration for the data cache.
   */
  dataCache?: {
    enabled: boolean

    /**
     * Options passed to the lru cache for components.
     */
    lruOptions?: LRUOptions<string, LRUCacheEntry>
  }

  /**
   * Configuration for the groups cache.
   */
  groupsCache?: {
    enabled?: boolean
  }
}
