import { defineEventHandler } from 'h3'
import { useCDNHeaders } from '#nuxt-multi-cache/composables'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper
      .public()
      .setNumeric('maxAge', 3600)
      .set('staleIfError', 24000)
      .set('staleWhileRevalidate', 60000)
      .set('mustRevalidate', true)
      .addTags(['api'])
  }, event)

  return {
    api: 'This response should have CDN headers.',
  }
})
