export interface CacheHelperCacheGroupEntry {
  name: string
  tags: string[]
}

export default class NuxtSSRCacheHelper {
  tags: string[]
  cacheGroups: CacheHelperCacheGroupEntry[]
  cacheable: boolean
  cacheableSet: boolean

  constructor() {
    this.tags = []
    this.cacheGroups = []
    this.cacheable = false
    this.cacheableSet = false
  }
}
