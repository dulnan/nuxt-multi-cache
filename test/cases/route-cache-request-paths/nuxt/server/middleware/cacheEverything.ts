import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

/**
 * Makes every route cacheable, including the API of the module.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(3600)
  }, event)
})
