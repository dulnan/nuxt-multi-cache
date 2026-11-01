import { createError, defineEventHandler, getQuery } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached with stale-if-error.
 *
 * "?fail=true" responds with a 503 error. The query is not part of the cache
 * key.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(60).setStaleIfError(3600)
  }, event)

  if (getQuery(event).fail) {
    throw createError({ statusCode: 503 })
  }

  return 'Stale if error ' + Date.now()
})
