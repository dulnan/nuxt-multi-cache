import { defineEventHandler } from 'h3'
import { useMultiCacheApp } from '#imports'

/**
 * Returns the names of the enabled caches.
 */
export default defineEventHandler(() => {
  const app = useMultiCacheApp()

  // Undefined if all features and the API are disabled.
  return { caches: app ? Object.keys(app.cache) : null }
})
