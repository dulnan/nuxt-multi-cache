import { Options as LRUOptions } from 'lru-cache'
import LRUCache, { LRUCacheEntry } from './../LRUCache'

export interface ComponentCacheConfig {
  /**
   * Enable component caching.
   */
  enabled: boolean

  /**
   * Options passed to the lru cache for components.
   */
  lruOptions?: LRUOptions<string, LRUCacheEntry>
}

function parseCacheKey(value = '') {
  const [key = '', rest = ''] = value.split('____')
  const tags = rest.split('$').filter(Boolean)
  return {
    key,
    tags
  }
}

/**
 * Caches components.
 */
export default class ComponentCache extends LRUCache {
  constructor(config: ComponentCacheConfig) {
    super(config.lruOptions)
  }

  get(value: string, cb?: (res: string) => void) {
    const { key } = parseCacheKey(value)
    const result = this.lru.get(key)
    const component = result?.data
    if (cb) {
      cb(component)
      return
    }

    return Promise.resolve(component)
  }

  set(value: string, data: any) {
    const { key, tags } = parseCacheKey(value)
    console.log('ComponentCache::set()   ' + key)
    this.updateTagCount(tags)
    this.lru.set(key, { tags, data, timestamp: Date.now() })
    return Promise.resolve(true)
  }

  has(value: string, cb: (hit: boolean) => void) {
    const { key } = parseCacheKey(value)
    const result = this.lru.has(key)

    if (cb) {
      return cb(result)
    }
    return Promise.resolve(result)
  }
}
