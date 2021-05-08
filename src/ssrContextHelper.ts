export default class NuxtSSRCacheHelper {
  tags: string[]
  globalTags: string[]
  cacheable: boolean

  constructor() {
    this.tags = []
    this.globalTags = []
    this.cacheable = false
  }
}
