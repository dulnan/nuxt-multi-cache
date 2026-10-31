import { createError } from 'h3'
import { useNitroApp } from 'nitropack/runtime'
import type { MultiCacheApp } from '../../types'

/**
 * Get the nuxt-multi-cache app.
 *
 * Returns undefined if the module's server plugin is not registered, which is
 * the case if all features and the API are disabled in the module options.
 */
export function useMultiCacheApp(): MultiCacheApp | undefined {
  return useNitroApp().multiCache
}

/**
 * Get the nuxt-multi-cache app in code that only runs if the server plugin is
 * registered, such as its hooks and the API handlers.
 *
 * Throws an error if the app is not available.
 */
export function getMultiCacheApp(): MultiCacheApp {
  const app = useMultiCacheApp()
  if (!app) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get nuxt-multi-cache app.',
    })
  }

  return app
}
