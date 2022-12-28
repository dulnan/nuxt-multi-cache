import { useCDNHeaders, useRouteCache } from '#nuxt-multi-cache'

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
      .addTags(cacheTags)
  }, event)

  useRouteCache((helper) => {
    helper.addTags(cacheTags).setCacheable()
  }, event)
  return {
    api: 'This is data from the API.',
    cacheTags,
  }
})
