import { defineEventHandler, setResponseHeader } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A cached route with a Cache-Status header of its own, like a response
 * proxied from an API with a cache.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-status', 'upstream-cache; hit')

  useRouteCache((helper) => {
    helper.setCacheable()
  }, event)

  return 'Upstream ' + Date.now()
})
