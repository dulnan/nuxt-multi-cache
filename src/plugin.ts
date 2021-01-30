import NuxtSSRCacheHelper from './ssrContextHelper'

export class RouteCacheHelper {
  cacheHelper?: NuxtSSRCacheHelper

  constructor(context: any) {
    if (context) {
      this.cacheHelper = context.$cacheHelper
    }
  }

  setCacheable() {
    if (this.cacheHelper) {
      this.cacheHelper.cacheable = true
    }
  }

  seUncacheable() {
    if (this.cacheHelper) {
      this.cacheHelper.cacheable = false
    }
  }

  addTags(tags = []) {
    if (this.cacheHelper) {
      this.cacheHelper.tags = [...this.cacheHelper.tags, ...tags]
    }
  }
}

export default (context: any, inject: (key: string, value: any) => void) => {
  inject('routeCache', new RouteCacheHelper(context.ssrContext))
}
