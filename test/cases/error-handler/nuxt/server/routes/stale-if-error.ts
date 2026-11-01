import { createError, defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached with stale-if-error. The query is not part of the cache key.
 *
 * - "?fail=true": responds with a 503 error.
 * - "?capture=true": captures a non-fatal error, e.g. like Nitro's cache does
 *   when its storage fails, and responds normally.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(60).setStaleIfError(3600)
  }, event)

  const query = getQuery(event)

  if (query.fail) {
    throw createError({ statusCode: 503 })
  }

  if (query.capture) {
    event.captureError(new Error('A non-fatal error.'), { tags: ['test'] })
  }

  // Unique, because requests can take less than a millisecond.
  return 'Generated ' + crypto.randomUUID()
})
