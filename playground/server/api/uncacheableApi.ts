import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

export default defineEventHandler<{ data: number }>((event) => {
  useRouteCache((v) => {
    v.setUncacheable()
  }, event)
  return {
    data: Date.now(),
  }
})
