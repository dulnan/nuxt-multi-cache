import LRU from 'lru-cache'

export default class DataCache {
  lru: LRU<string, any>

  constructor() {
    this.lru = new LRU({
      max: 100000,
    })
  }

  get(key: string): any {
    const result = this.lru.get(key)
    console.log('DataCache::get()   ' + key + ' ' + (!!result))
    return result
  }
  set(key: string, data: any): any {
    console.log('DataCache::set()   ' + key)
    this.lru.set(key, data)
  }
  has(key: string): boolean {
    return this.lru.has(key)
  }
}
