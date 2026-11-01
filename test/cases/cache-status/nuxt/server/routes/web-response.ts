import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route marked as cacheable whose body can't be stored: The route cache
 * only stores strings and data that can be serialized as JSON.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(3600)
  }, event)

  return new Response('Web response ' + Date.now())
})
