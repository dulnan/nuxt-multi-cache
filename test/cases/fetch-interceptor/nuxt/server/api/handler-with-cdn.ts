import { defineEventHandler } from 'h3'
import { useCDNHeaders } from '#imports'

export default defineEventHandler(async (event) => {
  useCDNHeaders((helper) => {
    helper.addTags(['cdn-cache-tag-from-api']).setNumeric('maxAge', '1h')
  }, event)

  return {
    timestamp: Date.now(),
  }
})
