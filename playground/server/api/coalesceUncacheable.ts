import { defineEventHandler } from 'h3'
import { useRouteCache } from '#imports'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()

  useRouteCache((helper) => {
    helper.setUncacheable()
  }, event)

  await new Promise((resolve) => setTimeout(resolve, 500))

  return { startedAt, endedAt: Date.now() }
})
