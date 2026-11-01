import { defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached with stale-while-revalidate.
 *
 * "?delay=1000" delays the response, so that other requests arrive while it's
 * being revalidated. The query is not part of the cache key.
 */
export default defineEventHandler(async (event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(60).allowStaleWhileRevalidate()
  }, event)

  const delay = Number(getQuery(event).delay ?? 0)
  if (delay) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  return 'SWR ' + Date.now()
})
