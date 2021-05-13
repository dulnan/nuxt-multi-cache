import { RenderCache } from 'vue-server-renderer'
import LRU from 'lru-cache'
import { Options as LRUOptions } from 'lru-cache'

export interface ComponentCacheEntry {
  tags: string[]
  timestamp?: number
  component?: any
  key?: string
}

export interface ComponentCacheConfig {
  /**
   * Enable component caching.
   */
  enabled: boolean

  /**
   * Options passed to the lru cache for components.
   */
  lruOptions?: LRUOptions<string, ComponentCacheEntry>
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
export default class ComponentCache implements RenderCache {
  lru: LRU<string, ComponentCacheEntry>
  tagCount: Record<string, number>

  constructor(config: ComponentCacheConfig) {
    this.lru = new LRU(config.lruOptions)
    this.tagCount = {}
  }

  get(value: string, cb?: (res: string) => void): string | void {
    const { key } = parseCacheKey(value)
    const result = this.lru.get(key)
    const component = result?.component
    if (cb) {
      cb(component)
    }

    console.log('ComponentCache::get()   ' + key)
    return component
  }

  set(value: string, component: any): void {
    const { key, tags } = parseCacheKey(value)
    console.log('ComponentCache::set()   ' + key)
    this.updateTagCount(tags)
    this.lru.set(key, { tags, component, timestamp: Date.now() })
  }

  has(value: string, cb?: (hit: boolean) => void): boolean | void {
    const { key } = parseCacheKey(value)
    const result = this.lru.has(key)

    if (cb) {
      cb(result)
    }
    return result
  }

  updateTagCount(tags: string[] = []) {
    tags.forEach(tag => {
      if (!this.tagCount[tag]) {
        this.tagCount[tag] = 0
      }
      this.tagCount[tag]++
    })
  }

  purge(keys: string[] = []) {
    keys.forEach(key => {
      if (this.lru.has(key)) {
        this.lru.del(key)
      }
    })
  }

  purgeTags(tags: string[] = []) {
    const removedKeys: string[] = []
    this.lru.forEach((entry, key) => {
      const match = entry.tags.some(v => tags.includes(v))
      if (match) {
        removedKeys.push(key)
        this.lru.del(key)
      }
    })

    return { removed: removedKeys, total: removedKeys.length }
  }

  getEntries(offset = 0, perPage = 128) {
    const rows: ComponentCacheEntry[] = []
    const start = offset
    const end = start + (perPage - 1)
    let i = 0
    this.lru.forEach((entry, key) => {
      if (i >= start && i < end) {
        rows.push({
          tags: entry.tags,
          timestamp: entry.timestamp,
          key
        })
      }
      i++
    })

    return { rows, total: i }
  }

  purgeAll() {
    this.lru.reset()
  }

  getCountForTag(tag: string): number {
    return this.tagCount[tag] || 0
  }
}
