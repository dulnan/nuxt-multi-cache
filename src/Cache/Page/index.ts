import { Url } from 'url'
export { default as PageCacheDisk } from './Disk'
export { default as PageCacheMemory } from './Memory'

/**
 * Determine the cache key for a route.
 */
export function getCacheKey(route: string, context: any) {
  const url = context.req._parsedUrl as Url
  const pathname = url.pathname

  if (!pathname) {
    return
  }

  return route
}
