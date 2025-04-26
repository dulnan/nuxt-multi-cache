import { defineEventHandler, createError, getQuery } from 'h3'
import { checkAuth, getCacheInstance } from './helpers'

export default defineEventHandler<Promise<unknown>>(async (event) => {
  await checkAuth(event)
  const cache = getCacheInstance(event)
  const query = getQuery(event)
  const key = query.key as string
  const item = await cache.getItem(key)
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Cache item does not exist.',
    })
  }
  return item
})
