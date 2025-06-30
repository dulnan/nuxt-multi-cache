import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

export default defineEventHandler(async (event) => {
  useRouteCache((helper) => {
    helper.setCacheable().addTags(['route-cache-tag-from-api'])
  }, event)

  return {
    timestamp: Date.now(),
  }
})
