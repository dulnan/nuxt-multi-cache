import { ComponentCacheConfig } from './'
import { RenderCache } from 'vue-server-renderer'
import LRU from 'lru-cache'

export interface ComponentCacheEntry {
  tags: string[]
  timestamp?: number
  component?: any
  key?: string
}

function parseCacheKey(value = '') {
  const [key = '', rest = ''] = value.split('____')
  const tags = rest.split('$').filter(Boolean)
  return {
    key,
    tags
  }
}

export default class ComponentCache implements RenderCache {
  lru: LRU<string, ComponentCacheEntry>

  constructor(config: ComponentCacheConfig) {
    this.lru = new LRU({
      max: 100000,
      ...config.lruOptions
    })
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
}
