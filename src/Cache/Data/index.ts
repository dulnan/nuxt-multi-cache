import { Options as LRUOptions } from 'lru-cache'
import LRUCache, { LRUCacheEntry }  from './../LRUCache'

export interface DataCacheConfig {
  enabled: boolean

  /**
   * Options passed to the lru cache for components.
   */
  lruOptions?: LRUOptions<string, LRUCacheEntry>
}

export default class DataCache extends LRUCache {
  constructor(config: DataCacheConfig) {
    super(config.lruOptions)
  }
}
