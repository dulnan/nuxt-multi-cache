import { defineEventHandler, getQuery } from 'h3'
import { useNitroApp } from 'nitropack/runtime'

/**
 * Stores something that isn't a route cache item under the given key, like an
 * item in an older format.
 */
export default defineEventHandler(async (event) => {
  const key = String(getQuery(event).key)
  await useNitroApp().multiCache!.cache.route!.storage.setItemRaw(
    key,
    'Not a route cache item',
  )
  return 'OK'
})
