import type { H3Event } from 'h3'
import { readBody } from 'h3'
import { NuxtMultiCacheSSRContext } from '../../types'
import { getModuleConfig } from '../helpers'
import { loadCacheContext } from './../helpers/storage'
import { checkAuth } from './helpers'

/**
 * Get the tags to be purged from the request.
 *
 * Either a single tag can be provided via URL param or an array of tags via
 * request body.
 */
async function getTagsToPurge(event: H3Event): Promise<string[]> {
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
 * Filter out duplicate array items.
 */
function onlyUnique(value: string, index: number, self: Array<string>) {
  return self.indexOf(value) === index
}

/**
 * A helper class to debounce cache tag invalidation.
 *
 * This prevents having too many invalidation requests coming in at once that
 * could lead to performance issues since tag invalidation is very
 * inefficient.
 */
class DebouncedInvalidator {
  /**
   * Buffer of tags to invalidate in the next run.
   */
  tags: string[]

  /**
   * Debounce delay.
   */
  delay: number | undefined

  /**
   * The current timeout ID for the next run. Reset after each run.
   */
  timeout: any

  constructor() {
    this.tags = []
    this.timeout = null
  }

  /**
   * Add tags to be purged.
   */
  add(tags: string[] = []) {
    tags.forEach((tag) => {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag)
      }
    })

    // Create a timeout to delay the actual invalidation.
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.invalidate()
      }, this.delay)
    }
  }

  /**
   * Invalidate the tags in the buffer.
   */
  async invalidate() {
    const cacheContext = await loadCacheContext()

    // Get the tags to invalidate and reset the buffer.
    const tags: string[] = this.tags.filter(onlyUnique)
    this.tags = []

    // Reset the timeout.
    this.timeout = null

    // Loop over all enabled caches.
    let key: keyof NuxtMultiCacheSSRContext
    for (key in cacheContext) {
      const cache = cacheContext[key]
      if (cache) {
        // Get the keys of all cache items.
        const cacheItemKeys = await cache.getKeys()
        // Loop over all keys and load the value.
        for (const cacheKey of cacheItemKeys) {
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
  }
}

// Create instance of DebouncedInvalidator.
const invalidator = new DebouncedInvalidator()

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
  if (!invalidator.delay) {
    const moduleConfig = await getModuleConfig()
    const delay = moduleConfig.api.cacheTagInvalidationDelay
    invalidator.delay = delay
  }

  await checkAuth(event)
  const tags = await getTagsToPurge(event)
  invalidator.add(tags)

  return {
    status: 'OK',
    tags,
  }
})
