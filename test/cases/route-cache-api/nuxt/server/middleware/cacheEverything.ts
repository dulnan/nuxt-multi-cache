import { defineEventHandler } from 'h3'
import { useCDNHeaders, useRouteCache } from '#imports'

/**
 * Makes every route cacheable in the route cache and on the CDN, including the
 * API of the module.
 */
export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(3600)
  }, event)

  useCDNHeaders((helper) => {
    helper.public().setNumeric('maxAge', 604800)
  }, event)
})
