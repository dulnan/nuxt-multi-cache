import { defineEventHandler, getQuery } from 'h3'
import { useDataCache } from '#imports'

/**
 * Stores a data cache item without a max age, like the items that 4.x stored
 * for useCachedAsyncData without a serverMaxAge.
 */
export default defineEventHandler(async (event) => {
  const { addToCache } = await useDataCache(String(getQuery(event).key), event)
  await addToCache('FROM_CACHE')
  return { status: 'OK' }
})
