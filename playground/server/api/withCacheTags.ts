import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(234234)
  }, event)
  return {
    data: 'This response should contain cache headers.',
  }
})
