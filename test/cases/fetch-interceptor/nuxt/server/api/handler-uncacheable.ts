import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

export default defineEventHandler(async (event) => {
  useRouteCache((helper) => {
    helper.setUncacheable()
  }, event)

  return {
    timestamp: Date.now(),
  }
})
