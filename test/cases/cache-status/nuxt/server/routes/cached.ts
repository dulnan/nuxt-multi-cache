import { defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached for an hour.
 *
 * With "?mode=uncacheable" it's not marked as cacheable. The query is not part
 * of the cache key.
 */
export default defineEventHandler((event) => {
  if (getQuery(event).mode !== 'uncacheable') {
    useRouteCache((helper) => {
      helper.setCacheable().setMaxAge(3600)
    }, event)
  }

  return 'Cached ' + Date.now()
})
