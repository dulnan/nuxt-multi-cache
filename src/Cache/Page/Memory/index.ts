import { CacheConfigPage, getCacheKey, GetCacheKeyMethod } from '..'
import LRUCache from './../../LRUCache'

export interface PageCacheMemoryEntry {
  tags: string[]
  markup: string
}

/**
 * Page cache.
 *
 * Routes are cached by their route name (path) and optionally by tags.
 * It's possible to purge a single route or purge all routes containing certain
 * tags.
 *
 * Routes are saved to disk, so that they can directly be served by a web
 * server.
 */
export default class PageCacheMemory extends LRUCache {
  /**
   * Method to determine the cache key for a route.
   */
  getCacheKey: GetCacheKeyMethod

  constructor(config: CacheConfigPage) {
    super()
    this.getCacheKey = config.getCacheKey || getCacheKey
  }
}
