import { defineEventHandler } from 'h3'
import { checkAuth, getCacheInstance } from './helpers'

function getData(cacheName: string, item: any) {
  if (cacheName === 'component') {
    if (typeof item === 'string') {
      return item
    } else if (typeof item === 'object') {
      return item.markup
    }
  } else if (cacheName === 'data') {
    if (item.data) {
      return item.data
    }
    return item
  }
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const cache = getCacheInstance(event)
  const cacheName = event.context.params.cacheName as string
  const key = event.context.params.key as string
  const item = await cache.getItem(key)
  if (!item) {
    throw createError({
      statusCode: 404,
    })
  }
  return getData(cacheName, item)
})
