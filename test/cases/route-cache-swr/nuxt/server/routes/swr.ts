import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached with stale-while-revalidate.
 *
 * The "mode" query param decides how the response ends up. It's not part of
 * the cache key, so all modes use the same cache item.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(60).allowStaleWhileRevalidate()
  }, event)

  const mode = getQuery(event).mode
  const generated = Date.now().toString()

  if (mode === 'not-found') {
    setResponseStatus(event, 404)
    return 'Not found ' + generated
  } else if (mode === 'uncacheable') {
    useRouteCache((helper) => helper.setUncacheable(), event)
    return 'Uncacheable ' + generated
  } else if (mode === 'empty') {
    return ''
  }

  return 'Generated ' + generated
})
