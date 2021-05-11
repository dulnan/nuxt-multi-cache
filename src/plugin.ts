import DataCache from './DataCache'
import NuxtSSRCacheHelper from './ssrContextHelper'

export class RouteCacheHelper {
  cacheHelper?: NuxtSSRCacheHelper
  dataCache?: DataCache

  constructor(context: any) {
    if (context) {
      this.cacheHelper = context.$cacheHelper
      this.dataCache = context.$dataCache
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

  /**
   * Add global tags.
   *
   * These should be tags that are present on all or a significant amount of
   * routes, for example tags of menu items and their links.
   *
   * Global tags are not added to the regular cache tags of a route, because
   * that would add an unnecessary large amount of tags for every route which
   * can quickly become an issue.
   *
   * Global tags are stored separately and are not linked to the current route.
   *
   * When purging one of the global tags it will immediately purge all routes.
   */
  addCacheGroup(name: string, tags = []) {
    if (this.cacheHelper) {
      this.cacheHelper.cacheGroups.push({ name, tags })
    }
  }

  /**
   * Set a data cache entry.
   */
  setDataCache(key: string, data: any, tags: string[] = []) {
    if (this.dataCache) {
      this.dataCache.set(key, data, tags)
    }
  }

  /**
   * Set a data cache entry tags.
   */
  setDataCacheTags(key: string, tags: string[] = []) {
    if (this.dataCache) {
      this.dataCache.setTags(key, tags)
    }
  }

  /**
   * Get a data cache entry.
   */
  getDataCache(key: string): any {
    if (this.dataCache) {
      if (this.dataCache.has(key)) {
        return this.dataCache.get(key)
      }
    }
  }
}

export default (context: any, inject: (key: string, value: any) => void) => {
  inject('routeCache', new RouteCacheHelper(context.ssrContext))
}
