import { useRouteCache } from '#nuxt-multi-cache/composables'
import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(234234)
  }, event)
  return {
    data: 'This response should contain cache headers.',
  }
})
