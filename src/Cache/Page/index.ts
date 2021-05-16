import { Context } from '@nuxt/types'
import { Url } from 'url'
export { default as PageCacheDisk } from './Disk'
export { default as PageCacheMemory } from './Memory'

export type GetCacheKeyMethod = (
  route: string,
  context: Context
) => string | void

export enum PageCacheMode {
  Disk = 'disk',
  Memory = 'memory'
}

/**
 * Determine the cache key for a route.
 */
export function getCacheKey(route: string, context: any) {
  const url = context.req._parsedUrl as Url
  const pathname = url.pathname

  if (!pathname) {
    return
  }

  return route
}

export interface CacheConfigPage {

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
  getCacheKey?: GetCacheKeyMethod
}
