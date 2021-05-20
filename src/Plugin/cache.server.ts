import GroupsCache from './../Cache/Groups'
import DataCache from './../Cache/Data'
import NuxtSSRCacheHelper from './../ssrContextHelper'
import {CachePlugin} from './cache.client'

export class CachePluginRoute {
  helper: NuxtSSRCacheHelper

  constructor(helper: NuxtSSRCacheHelper) {
    this.helper = helper
  }

  /**
   * Mark the current request as cacheable.
   *
   * Note: If the current request was set to 'uncachable' before, it will not
   * set it to cacheable again.
   */
  setCacheable() {
    if (!this.helper) {
      return
    }
    if (this.helper.cacheableSet) {
      console.log('The request has already been set as uncachable.')
      return
    }
    this.helper.cacheable = true
  }

  /**
   * Set this request to be uncachable.
   *
   * Note: This function should only be called once. Afterwards it's not
   * possible to set the request to be cacheable again.
   */
  setUncacheable() {
    if (!this.helper) {
      return
    }
    this.helper.cacheable = false
    this.helper.cacheableSet = true
  }

  /**
   * Add cache tags for the current request.
   */
  addTags(tags: string[] = []) {
    if (!this.helper) {
      return
    }
    this.helper.tags = [...this.helper.tags, ...tags]
  }
}

export class CachePluginData {
  cache: DataCache

  constructor(cache: DataCache) {
    this.cache = cache
  }

  /**
   * Set a data cache entry.
   */
  set(key: string, data: any, tags: string[] = []) {
    if (!this.cache) {
      return
    }
    this.cache.set(key, data, tags)
  }

  /**
   * Get a data cache entry.
   */
  get(key: string): any {
    if (!this.cache) {
      return
    }
    return this.cache.get(key)
  }
}

export class CachePluginGroups {
  cache: GroupsCache

  constructor(cache: GroupsCache) {
    this.cache = cache
  }

  /**
   * Add a cache group.
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
  add(name: string, tags: string[] = []) {
    if (!this.cache) {
      return
    }
    this.cache.set(name, '', tags)
  }
}

export default (context: any, inject: (key: string, value: any) => void) => {
  const plugin: CachePlugin = {
    route: new CachePluginRoute(context.ssrContext.$cacheHelper),
    data: new CachePluginData(context.ssrContext.$dataCache),
    groups: new CachePluginGroups(context.ssrContext.$groupsCache),
  }
  inject('cache', plugin)
}
