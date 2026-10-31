import {
  defineEventHandler,
  createError,
  getQuery,
  setResponseHeader,
} from 'h3'
import { checkAuth, getCacheInstance } from './helpers'

export default defineEventHandler<Promise<unknown>>(async (event) => {
  await checkAuth(event)
  const { storage } = getCacheInstance(event)
  const query = getQuery(event)
  const key = query.key as string
  const item = await storage.getItem(key)
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Cache item does not exist.',
    })
  }

  // Route and component items are stored as strings, which h3 would send as
  // text/html. Their content, e.g. the body of a JSON response, would then be
  // rendered as markup in the browser of whoever opens the URL.
  if (typeof item === 'string') {
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  }

  return item
})
