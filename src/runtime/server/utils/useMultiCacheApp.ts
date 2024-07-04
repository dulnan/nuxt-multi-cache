import { useNitroApp } from 'nitropack/runtime'
import type { MultiCacheApp } from '../../types'

/**
 * Get the nuxt-multi-cache app.
 */
export function useMultiCacheApp(): MultiCacheApp {
  const app = useNitroApp()
  return app.multiCache
}
