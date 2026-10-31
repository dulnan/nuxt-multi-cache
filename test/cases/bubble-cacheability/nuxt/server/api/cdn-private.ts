import { defineEventHandler, setResponseHeader } from 'h3'
import { useCDNHeaders } from '#imports'

export default defineEventHandler((event) => {
  useCDNHeaders((cdn) => {
    cdn.private()
  }, event)

  // Set after the CDN headers have been applied.
  setResponseHeader(event, 'cache-control', 'public, max-age=60')

  return { ok: true }
})
