import { defineEventHandler } from 'h3'
import { useRouteCache } from '#nuxt-multi-cache/composables'

export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(234234)
  }, event)
  const number = Math.round(Math.random() * 1000000000)
  return 'This is a compressed API response: ' + number
})
