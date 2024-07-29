import { defineEventHandler } from 'h3'
import { useRouteCache } from '#nuxt-multi-cache/composables'

export default defineEventHandler<{ data: number }>((event) => {
  useRouteCache((v) => {
    v.setUncacheable()
  }, event)
  return {
    data: Date.now(),
  }
})
