import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

/**
 * A route cached without a max age.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable()
  }, event)

  return 'Permanent ' + Date.now()
})
