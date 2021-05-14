import LRU from 'lru-cache'
import { Options as LRUOptions } from 'lru-cache'
import { Cache } from './../'

export interface DataCacheEntry {
  tags: string[]
  timestamp: number
  data: any
  key: string
}

export interface DataCacheConfig {
  enabled: boolean

  /**
   * Options passed to the lru cache for components.
   */
  lruOptions?: LRUOptions<string, DataCacheEntry>
}

export default class DataCache implements Cache {
  lru: LRU<string, DataCacheEntry>
  tagCount: Record<string, number>

  constructor(config: DataCacheConfig) {
    this.lru = new LRU(config.lruOptions)
    this.tagCount = {}
  }

  getNamespace() {
    return 'data'
  }

  get(key: string) {
    const result = this.lru.get(key)
    if (result) {
      return Promise.resolve(result.data)
    }

    return Promise.resolve()
  }

  set(key: string, data: any, tags: string[] = []) {
    this.updateTagCount(tags)
    this.lru.set(key, { key, data, tags, timestamp: Date.now() })
    return Promise.resolve(true)
  }

  has(key: string): Promise<boolean> {
    return Promise.resolve(this.lru.has(key))
  }

  updateTagCount(tags: string[] = []) {
    tags.forEach(tag => {
      if (!this.tagCount[tag]) {
        this.tagCount[tag] = 0
      }
      this.tagCount[tag]++
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

    return Promise.resolve({ purged: removedKeys.length, success: true })
  }

  purgeKeys(keys: string[]) {
    keys.forEach(key => {
      this.lru.del(key)
    })

    return Promise.resolve({ purged: keys.length, success: true })
  }

  getEntries(_offset = 0) {
    const rows: any[] = []
    this.lru.forEach((entry: DataCacheEntry, key: string) => {
      rows.push({
        key,
        timestamp: entry.timestamp,
        tags: entry.tags
      })
    })

    return Promise.resolve({ total: rows.length, rows })
  }

  getCountForTag(tag: string) {
    return Promise.resolve(this.tagCount[tag] || 0)
  }

  purgeAll() {
    const purged = this.lru.length
    this.lru.reset()
    return Promise.resolve({ purged, success: true })
  }
}
