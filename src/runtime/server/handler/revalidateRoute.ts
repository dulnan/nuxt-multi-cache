import { type H3Event, getRequestHeaders, getRequestURL } from 'h3'
import { getMultiCacheContext } from '../../helpers/server'
import { logger } from '../../helpers/multi-cache-logger'

const locks = new Set<string>()

/**
 * Revalidates a cached route in the background by making a fresh request.
 * This is used for stale-while-revalidate behavior.
 */
export async function revalidateRoute(
  event: H3Event,
  fullKey: string,
): Promise<void> {
  // Prevent duplicate revalidations for the same key
  if (locks.has(fullKey)) {
    return
  }

  locks.add(fullKey)

  try {
    const context = getMultiCacheContext(event)
    if (!context?.route) {
      return
    }

    const url = getRequestURL(event)
    const headers = getRequestHeaders(event)

    // Build the full URL for the request
    const protocol = event.node?.req?.socket?.encrypted ? 'https' : 'http'
    const host = headers.host || 'localhost'
    const fullUrl = `${protocol}://${host}${url.pathname}${url.search}${url.hash}`

    // Make a fresh request to revalidate the cache
    // Add a special header to indicate this is a revalidation request
    const requestHeaders: Record<string, string> = {
      ...headers,
      'x-nuxt-multi-cache-revalidate': '1',
    }

    // Remove headers that shouldn't be forwarded
    delete requestHeaders['content-length']
    delete requestHeaders['transfer-encoding']

    const response = await fetch(fullUrl, {
      method: event.method || 'GET',
      headers: requestHeaders,
      // @ts-ignore - body may not be available in all contexts
      body:
        event.method !== 'GET' && event.method !== 'HEAD'
          ? event.context._swrRequest?.body
          : undefined,
    })

    // If the response indicates an error, remove the stale cache entry
    if (response.status >= 400) {
      await context.route.storage.removeItem(fullKey)
      logger.info(`Removed cache entry after failed revalidation: ${fullKey}`)
      return
    }

    // The fresh response should have been cached by the normal caching flow
    // (via the afterResponse hook), so we don't need to manually cache it here.
    // Just consume the body to complete the request
    await response.text()

    logger.info(`Successfully revalidated cache for: ${fullKey}`)
  } catch (error) {
    // On error during revalidation, remove the cache entry to prevent
    // serving stale data indefinitely
    logger.error(`Error during route revalidation for key "${fullKey}":`, error)

    const context = getMultiCacheContext(event)
    if (context?.route) {
      try {
        await context.route.storage.removeItem(fullKey)
      } catch (removeError) {
        logger.error(
          `Failed to remove cache entry after revalidation error:`,
          removeError,
        )
      }
    }
  } finally {
    locks.delete(fullKey)
  }
}
