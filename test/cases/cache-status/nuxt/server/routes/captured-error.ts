import { defineEventHandler, setResponseHeader } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A cached route that captures a non-fatal error before it sets a
 * Cache-Status header of its own. Nitro calls the error hook for it, but the
 * request continues.
 */
export default defineEventHandler((event) => {
  event.captureError(new Error('A non-fatal error.'), { tags: ['test'] })

  setResponseHeader(event, 'cache-status', 'upstream-cache; hit')

  useRouteCache((helper) => {
    helper.setCacheable()
  }, event)

  return 'Captured error ' + Date.now()
})
