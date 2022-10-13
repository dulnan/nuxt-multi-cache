import { Cache } from './..'
import LRU, { Options as LRUOptions } from 'lru-cache'

export interface LRUCacheEntry {
  key?: string
  tags: string[]
  data?: any
  timestamp: number
}

/**
 * Caches components.
 */
export default class LRUCache implements Cache {
  lru: LRU<string, LRUCacheEntry>
  tagCount: Record<string, number>

  constructor(lruOptions?: LRUOptions<string, LRUCacheEntry>) {
    this.lru = new LRU(lruOptions)
    this.tagCount = {}
  }

  get(key: string, cb?: (res: string) => void) {
    const result = this.lru.get(key)
    if (result) {
      if (cb) {
        cb(result.data)
        return
      }
      return Promise.resolve(result.data)
    }

    return Promise.resolve()
  }

  set(key: string, data: any, tags: string[] = []) {
    this.updateTagCount(tags)
    this.lru.set(key, { key, data, tags, timestamp: Date.now() })
    return Promise.resolve(true)
  }

  has(key: string, cb?: (hit: boolean) => void) {
    const result = this.lru.has(key)

    if (cb) {
      return cb(result)
    }
    return Promise.resolve(result)
  }

  updateTagCount(tags: string[] = []) {
    tags.forEach((tag) => {
      if (!this.tagCount[tag]) {
        this.tagCount[tag] = 0
      }
      this.tagCount[tag]++
    })
  }

  rebuildTagCount() {
    const map: Record<string, number> = {}
    this.lru.forEach((entry, key) => {
      entry.tags.forEach((tag) => {
        if (!map[tag]) {
          map[tag] = 0
        }
        map[tag]++
      })
    })

    this.tagCount = map
  }

  purgeTags(tags: string[] = []) {
    const removedKeys: string[] = []
    this.lru.forEach((entry, key) => {
      const match = entry.tags.some((v) => tags.includes(v))
      if (match) {
        removedKeys.push(key)
        this.lru.del(key)
      }
    })

    this.rebuildTagCount()

    return Promise.resolve({ purged: removedKeys.length, success: true })
  }

  purgeKeys(keys: string[]) {
    keys.forEach((key) => {
      this.lru.del(key)
    })

    this.rebuildTagCount()
    return Promise.resolve({ purged: keys.length, success: true })
  }

  getTags() {
    const rows = Object.keys(this.tagCount).map((tag) => {
      return {
        tag,
        count: this.tagCount[tag],
      }
    })
    return Promise.resolve(rows)
  }

  getEntries(offset = 0) {
    const perPage = 100
    const rows: LRUCacheEntry[] = []
    const start = offset
    const end = start + (perPage - 1)
    let i = 0
    this.lru.forEach((entry, key) => {
      if (i >= start && i < end) {
        rows.push({
          tags: entry.tags,
          timestamp: entry.timestamp,
          key,
        })
      }
      i++
    })

    return Promise.resolve({ rows, total: i })
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
