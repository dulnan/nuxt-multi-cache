export default class NuxtSSRCacheHelper {
  tags: string[]
  cacheable: boolean

  constructor() {
    this.tags = []
    this.cacheable = false
  }
}
