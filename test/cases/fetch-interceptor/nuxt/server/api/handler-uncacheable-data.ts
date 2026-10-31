import { defineEventHandler } from 'h3'
import { useDataCacheCallback, useRouteCache } from '#imports'

export default defineEventHandler(async (event) => {
  useRouteCache((helper) => {
    helper.setCacheable()
  }, event)

  // The uncacheable data cache item makes the route of the API route
  // uncacheable.
  const timestamp = await useDataCacheCallback(
    'uncacheable-data',
    (helper) => {
      helper?.setUncacheable()
      return Date.now()
    },
    event,
    { bubbleCacheability: 'route' },
  )

  return {
    timestamp,
  }
})
