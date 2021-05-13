import LRU from 'lru-cache'
import { Options as LRUOptions } from 'lru-cache'

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

export default class DataCache {
  lru: LRU<string, DataCacheEntry>
  tagCount: Record<string, number>

  constructor(config: DataCacheConfig) {
    this.lru = new LRU(config.lruOptions)
    this.tagCount = {}
  }

  get(key: string): Promise<any> {
    const result = this.lru.get(key)
    console.log('DataCache::get()   ' + key + ' ' + (!!result))
    if (result) {
      return result.data
    }

    return Promise.resolve(false)
  }

  set(key: string, data: any, tags: string[] = []): any {
    console.log('DataCache::set()   ' + key)
    this.updateTagCount(tags)
    this.lru.set(key, { key, data, tags, timestamp: Date.now() })
  }

  setTags(key: string, tags: string[] = []) {
    const entry = this.lru.get(key)
    if (entry) {
      entry.tags = tags
      this.lru.set(key, entry)
    }
  }

  has(key: string): boolean {
    return this.lru.has(key)
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

    return { removed: removedKeys, total: removedKeys.length }
  }

  purgeEntry(key: string) {
    this.lru.del(key)
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

    return { total: rows.length, rows }
  }

  getCountForTag(tag: string): number {
    return this.tagCount[tag] || 0
  }

  purgeAll() {
    this.lru.reset()
  }
}
