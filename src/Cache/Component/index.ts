import { Cache } from './..'
import LRU, { Options as LRUOptions } from 'lru-cache'

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
export default class ComponentCache implements Cache {
  lru: LRU<string, ComponentCacheEntry>
  tagCount: Record<string, number>

  constructor(config: ComponentCacheConfig) {
    this.lru = new LRU(config.lruOptions)
    this.tagCount = {}
  }

  getNamespace() {
    return 'component'
  }

  get(value: string, cb?: (res: string) => void) {
    const { key } = parseCacheKey(value)
    const result = this.lru.get(key)
    const component = result?.component
    if (cb) {
      cb(component)
      return
    }

    return Promise.resolve(component)
  }

  set(value: string, component: any) {
    const { key, tags } = parseCacheKey(value)
    console.log('ComponentCache::set()   ' + key)
    this.updateTagCount(tags)
    this.lru.set(key, { tags, component, timestamp: Date.now() })
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

  updateTagCount(tags: string[] = []) {
    tags.forEach(tag => {
      if (!this.tagCount[tag]) {
        this.tagCount[tag] = 0
      }
      this.tagCount[tag]++
    })
  }

  purgeKeys(keys: string[] = []) {
    keys.forEach(key => {
      if (this.lru.has(key)) {
        this.lru.del(key)
      }
    })

    return Promise.resolve({ purged: keys.length, success: true })
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

    return Promise.resolve({ purged: removedKeys.length, success: true })
  }

  getEntries(offset = 0) {
    const perPage = 100
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

    return Promise.resolve({ rows, total: i })
  }

  purgeAll() {
    const purged = this.lru.length
    this.lru.reset()
    return Promise.resolve({ purged, success: true })
  }

  getCountForTag(tag: string) {
    return Promise.resolve(this.tagCount[tag] || 0)
  }
}
