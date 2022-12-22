import { useSSRContext } from 'vue'
import { getMultiCacheRouteContext } from '../helpers/server'

type NuxtMultiCacheRouteContextHelper = {
  /**
   * Add cache tags for this route.
   */
  addTags: (tags: string[]) => void

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
  setCacheable: () => void

  /**
   * Mark the route as uncacheable.
   *
   * After that there is no way to make it cacheable again.
   */
  setUncacheable: () => void

  /**
   * Set the max age.
   *
   * The value is only set if it's smaller than the current max age or if it
   * hasn't been set yet. The initial value is `null`.
   */
  setMaxAge: (maxAge: number) => void
}

/**
 * Get the helper to be used for interacting with the route cache.
 *
 * The helper provides ways to set the cacheability, cache tags, max age for
 * the current route.
 */
export function useRouteCache(): NuxtMultiCacheRouteContextHelper {
  const dummy: NuxtMultiCacheRouteContextHelper = {
    addTags: () => {},
    getTags: () => [],
    setCacheable: () => {},
    setUncacheable: () => {},
    setMaxAge: () => {},
  }

  if (!process.server) {
    return dummy
  }

  // SSR context should exist at this point, but TS doesn't know that.
  const ssrContext = useSSRContext()
  if (!ssrContext) {
    return dummy
  }

  const routeContext = getMultiCacheRouteContext(ssrContext.event)
  if (!routeContext) {
    return dummy
  }

  return {
    addTags: (tags) => {
      routeContext.tags.push(...tags)
    },
    getTags: () => {
      return routeContext.tags
    },
    setCacheable: () => {
      // Only set it to cacheable if it's in the initial state.
      if (routeContext.cacheable === null) {
        routeContext.cacheable = true
      }
    },
    setUncacheable: () => {
      // Setting to false is always possible.
      routeContext.cacheable = false
    },
    setMaxAge: (maxAge = 0) => {
      // Only set the maxAge if the value is smaller than the current.
      if (!routeContext.maxAge || maxAge < routeContext.maxAge) {
        routeContext.maxAge = maxAge
      }
    },
  }
}
