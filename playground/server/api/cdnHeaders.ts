import { defineEventHandler } from 'h3'
import { useCDNHeaders } from '#imports'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper
      .public()
      .setNumeric('maxAge', 60)
      .set('staleIfError', 24000)
      .set('staleWhileRevalidate', 60000)
      .set('mustRevalidate', true)
      .addTags(['api'])
  }, event)

  return {
    api: 'This response should have CDN headers.',
  }
})
