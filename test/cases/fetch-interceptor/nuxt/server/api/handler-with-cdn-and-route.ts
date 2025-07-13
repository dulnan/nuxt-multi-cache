import { defineEventHandler } from 'h3'
import { useCDNHeaders, useRouteCache } from '#imports'

export default defineEventHandler(async (event) => {
  useCDNHeaders((helper) => {
    helper.addTags(['cdn-cache-tag-from-api'])
  }, event)

  useRouteCache((helper) => {
    helper.setCacheable().addTags(['route-cache-tag-from-api'])
  }, event)

  return {
    timestamp: Date.now(),
  }
})
