import { defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#imports'

/**
 * An API route that a page requests with POST during SSR.
 */
export default defineEventHandler(async (event) => {
  const uncacheable = !!getQuery(event).uncacheable
  useRouteCache((helper) => {
    if (uncacheable) {
      helper.setUncacheable()
    } else {
      helper
        .setCacheable()
        .setMaxAge(600)
        .addTags(['route-cache-tag-from-post'])
    }
  }, event)

  return {
    timestamp: Date.now(),
  }
})
