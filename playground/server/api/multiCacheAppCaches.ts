import { defineEventHandler } from 'h3'
// Not from #imports: The generated route types also include this file in the
// app's type check, where server utils aren't auto-imported.
import { useMultiCacheApp } from './../../../src/runtime/server/utils/useMultiCacheApp'

/**
 * Returns the names of the enabled caches.
 */
export default defineEventHandler(() => {
  const app = useMultiCacheApp()

  // Undefined if all features and the API are disabled.
  return { caches: app ? Object.keys(app.cache) : null }
})
