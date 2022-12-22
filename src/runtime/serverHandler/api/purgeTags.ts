import type { H3Event } from 'h3'
import { readBody } from 'h3'
import { getMultiCacheContext } from '../../helpers/server'
import { NuxtMultiCacheSSRContext } from '~~/modules/componentCache/types'

async function getTagsToPurge(event: H3Event): Promise<string[]> {
  const tag = event.context.params.tag
  if (tag) {
    return [tag]
  }

  const body = await readBody(event)
  if (body && Array.isArray(body)) {
    return body
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No valid tags provided.',
  })
}

/**
 * Purges all cache entries by tag.
 *
 * Currently this is highliy inefficient, since we have to load each cache
 * entry in order to figure out if it has to be invalidated.
 *
 * Should be refactored so that a separate lookup table is managed that keeps
 * track of all cache tags and the cache items that use them.
 */
export default defineEventHandler(async (event) => {
  const tags = await getTagsToPurge(event)
  const cacheContext = getMultiCacheContext(event)
  if (!cacheContext) {
    return
  }

  // Loop over all enabled caches.
  let key: keyof NuxtMultiCacheSSRContext
  for (key in cacheContext) {
    const cache = cacheContext[key]
    if (cache) {
      // Get the keys of all cache items.
      const cacheItemKeys = await cache.getKeys()
      // Loop over all keys and load the value.
      for (const cacheKey in cacheItemKeys) {
        const item = await cache.getItem(cacheKey)
        // We only care about items that are stored as objects.
        if (item && typeof item === 'object' && 'cacheTags' in item) {
          const itemCacheTags: string[] = item.cacheTags as string[]

          // Determine if the cache item should be removed.
          const shouldPurge = itemCacheTags.some((v) => {
            return tags.includes(v)
          })
          if (shouldPurge) {
            await cache.removeItem(cacheKey)
          }
        }
      }
    }
  }

  return {
    status: 'OK',
    tags,
  }
})
