import type { H3Event } from 'h3'
import { useSSRContext } from 'vue'
import { getMultiCacheRouteContext } from '../../helpers/server'

interface NuxtMultiCacheRouteContextHelper {
  /**
   * Add cache tags for this route.
   */
  addTags: (tags: string[]) => NuxtMultiCacheRouteContextHelper

  /**
   * Get all cache tags.
   */
  getTags: () => string[]

  /**
   * Mark this route as cacheable.
   *
   * The initial value is null and this method only changes the value if it is
   * null. This means that once it's set to uncacheable, there is no way to
   * change it back.
   */
  setCacheable: () => NuxtMultiCacheRouteContextHelper

  /**
   * Mark the route as uncacheable.
   *
   * After that there is no way to make it cacheable again.
   */
  setUncacheable: () => NuxtMultiCacheRouteContextHelper

  /**
   * Set the max age.
   *
   * The value is only set if it's smaller than the current max age or if it
   * hasn't been set yet. The initial value is `null`.
   */
  setMaxAge: (maxAge: number) => NuxtMultiCacheRouteContextHelper
}

/**
 * Get the helper to be used for interacting with the route cache.
 *
 * The helper provides ways to set the cacheability, cache tags, max age for
 * the current route.
 */
export function useRouteCache(
  event?: H3Event,
): NuxtMultiCacheRouteContextHelper {
  const dummy: NuxtMultiCacheRouteContextHelper = {
    addTags: function () {
      return this
    },
    getTags: () => [],
    setCacheable: function () {
      return this
    },
    setUncacheable: function () {
      return this
    },
    setMaxAge: function () {
      return this
    },
  }

  if (process.client) {
    return dummy
  }

  const getEvent = () => {
    if (event) {
      return event
    }
    // SSR context should exist at this point, but TS doesn't know that.
    const ssrContext = useSSRContext()
    if (ssrContext) {
      return ssrContext.event
    }
  }

  const h3Event = getEvent()
  if (!h3Event) {
    return dummy
  }

  const routeContext = getMultiCacheRouteContext(h3Event)
  if (!routeContext) {
    return dummy
  }

  const helper: NuxtMultiCacheRouteContextHelper = {
    addTags: (tags) => {
      routeContext.tags.push(...tags)
      return helper
    },
    getTags: () => {
      return routeContext.tags
    },
    setCacheable: () => {
      // Only set it to cacheable if it's in the initial state.
      if (routeContext.cacheable === null) {
        routeContext.cacheable = true
      }
      return helper
    },
    setUncacheable: () => {
      // Setting to false is always possible.
      routeContext.cacheable = false
      return helper
    },
    setMaxAge: (maxAge = 0) => {
      // Only set the maxAge if the value is smaller than the current.
      if (!routeContext.maxAge || maxAge < routeContext.maxAge) {
        routeContext.maxAge = maxAge
      }
      return helper
    },
  }
  return helper
}
