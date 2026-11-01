import { createError, defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached with stale-while-revalidate. The query is not part of the
 * cache key.
 *
 * - "?fail=true": responds with a 503 error.
 * - "?capture=true": captures a non-fatal error and responds normally.
 * - "?delay=1000": delays the response, so that other requests arrive while
 *   it's being revalidated.
 */
export default defineEventHandler(async (event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(60).allowStaleWhileRevalidate()
  }, event)

  const query = getQuery(event)

  if (query.fail) {
    throw createError({ statusCode: 503 })
  }

  if (query.capture) {
    event.captureError(new Error('A non-fatal error.'), { tags: ['test'] })
  }

  const delay = Number(query.delay ?? 0)
  if (delay) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  // Unique, because requests can take less than a millisecond.
  return 'Generated ' + crypto.randomUUID()
})
