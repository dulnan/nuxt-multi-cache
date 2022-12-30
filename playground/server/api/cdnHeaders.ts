import { useCDNHeaders } from '#nuxt-multi-cache'

export default defineEventHandler((event) => {
  const cacheTags: string[] = [
    'page:1',
    'image:234',
    'user:32',
    'language',
    'translations',
  ]
  useCDNHeaders((helper) => {
    helper
      .set('maxAge', 1337)
      .setNumeric('maxAge', 0)
      .public()
      .set('staleIfError', 24000)
      .set('staleWhileRevalidate', 60000)
      .set('mustRevalidate', true)
      .addTags(cacheTags)
  }, event)

  return {
    api: 'This response should have CDN headers.',
  }
})
