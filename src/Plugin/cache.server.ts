import DataCache from './../Cache/Data'
import NuxtSSRCacheHelper from './../ssrContextHelper'

export class RouteCacheHelper {
  cacheHelper?: NuxtSSRCacheHelper
  dataCache?: DataCache

  constructor(context: any) {
    if (context) {
      this.cacheHelper = context.$cacheHelper
      this.dataCache = context.$dataCache
    }
  }

  /**
   * Mark the current request as cacheable.
   *
   * Note: If the current request was set to 'uncachable' before, it will not
   * set it to cacheable again.
   */
  setCacheable() {
    if (!this.cacheHelper) {
      return
    }

    if (this.cacheHelper.cacheableSet) {
      console.log('The request has already been set as uncachable.')
      return
    }
    this.cacheHelper.cacheable = true
  }

  /**
   * Set this request to be uncachable.
   *
   * Note: This function should only be called once. Afterwards it's not
   * possible to set the request to be cacheable again.
   */
  seUncacheable() {
    if (!this.cacheHelper) {
      return
    }
    this.cacheHelper.cacheable = false
    this.cacheHelper.cacheableSet = true
  }

  /**
   * Add cache tags for the current request.
   */
  addTags(tags = []) {
    if (!this.cacheHelper) {
      return
    }

    this.cacheHelper.tags = [...this.cacheHelper.tags, ...tags]
  }

  /**
   * Add a cache ground.
   *
   * These should be tags that are present on all or a significant amount of
   * routes, for example tags of menu items and their links.
   *
   * Tags of a cache group are not added to the regular cache tags of a route,
   * because that would add an unnecessary large amount of tags for every route
   * which can quickly become an issue.
   *
   * Cache groups are stored separately and are not linked to the current route.
   *
   * You can assign the cache group name as a regular tag to components, data
   * or routes.
   *
   * If a tag of a cache group is purged, it will also automatically purge all
   * entries that reference this cache group.
   */
  addCacheGroup(name: string, tags = []) {
    if (!this.cacheHelper) {
      return
    }

    this.cacheHelper.cacheGroups.push({ name, tags })
  }

  /**
   * Set a data cache entry.
   */
  setDataCache(key: string, data: any, tags: string[] = []) {
    if (!this.dataCache) {
      return
    }

    this.dataCache.set(key, data, tags)
  }

  /**
   * Set a data cache entry tags.
   */
  setDataCacheTags(key: string, tags: string[] = []) {
    if (!this.dataCache) {
      return
    }

    this.dataCache.setTags(key, tags)
  }

  /**
   * Get a data cache entry.
   */
  getDataCache(key: string): any {
    if (!this.dataCache) {
      return
    }

    if (this.dataCache.has(key)) {
      return this.dataCache.get(key)
    }
  }
}

export default (context: any, inject: (key: string, value: any) => void) => {
  inject('routeCache', new RouteCacheHelper(context.ssrContext))
}
