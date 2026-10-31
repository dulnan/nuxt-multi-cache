import { createError, defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

let requests = 0

/**
 * Fails every other request, which ofetch retries.
 */
export default defineEventHandler((event) => {
  requests++
  if (requests % 2 === 1) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Flaky',
    })
  }

  useRouteCache((helper) => {
    helper.setCacheable().addTags(['route-cache-tag-from-retry'])
  }, event)

  return {
    timestamp: Date.now(),
  }
})
