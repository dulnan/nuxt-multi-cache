import { defineEventHandler } from 'h3'
import { useCDNHeaders } from '#imports'

/**
 * Allows shared caches to keep the response longer than browsers.
 */
export default defineEventHandler(async (event) => {
  useCDNHeaders((helper) => {
    helper.public().setNumeric('maxAge', 600).setNumeric('sharedMaxAge', 3600)
  }, event)

  return {
    timestamp: Date.now(),
  }
})
