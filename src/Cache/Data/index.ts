import { MultiCacheConfig } from './../../config'
import LRUCache from './../LRUCache'

export default class DataCache extends LRUCache {
  constructor(config: MultiCacheConfig['dataCache']) {
    super(config?.lruOptions)
  }
}
