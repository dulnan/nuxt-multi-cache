import type { H3Event } from 'h3'
import { readBody, defineEventHandler, createError } from 'h3'
import {
  decodeComponentCacheItem,
  decodeRouteCacheItem,
  handleRawCacheData,
} from '../../helpers/cacheItem'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { onlyUnique } from '../../helpers/server'
import { DEFAULT_CACHE_TAG_INVALIDATION_DELAY } from './../../../build/options/defaults'
import type { CachePurgeTagsResponse, MultiCacheInstances } from './../../types'
import { checkAuth } from './helpers'
import { cacheTagInvalidationDelay } from '#nuxt-multi-cache/config'

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
 * A helper class to debounce cache tag invalidation.
 *
 * This prevents having too many invalidation requests coming in at once that
 * could lead to performance issues since tag invalidation is very
 * inefficient.
 */
export class DebouncedInvalidator {
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

  /**
   * The cache context instance.
   */
  cacheContext: MultiCacheInstances | undefined

  constructor() {
    this.tags = []
    this.timeout = null
    this.delay = DEFAULT_CACHE_TAG_INVALIDATION_DELAY
  }

  setDelay(delay = DEFAULT_CACHE_TAG_INVALIDATION_DELAY) {
    this.delay = delay
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

  async getCacheTags(
    cacheName: keyof MultiCacheInstances,
    key: string,
  ): Promise<string[] | undefined> {
    if (cacheName === 'data') {
      const item = await this.cacheContext?.[cacheName]?.storage.getItem(key)
      if (item && typeof item === 'object' && item !== null) {
        return (item as any).cacheTags
      }
    } else if (cacheName === 'route') {
      const cached = handleRawCacheData(
        await this.cacheContext?.[cacheName]?.storage.getItemRaw(key),
      )
      if (cached) {
        return decodeRouteCacheItem(cached)?.cacheTags
      }
    } else if (cacheName === 'component') {
      const cached = handleRawCacheData(
        await this.cacheContext?.[cacheName]?.storage.getItemRaw(key),
      )
      if (cached) {
        return decodeComponentCacheItem(cached)?.cacheTags
      }
    }
  }

  /**
   * Invalidate the tags in the buffer.
   */
  async invalidate() {
    if (!this.cacheContext) {
      return
    }

    // Get the tags to invalidate and reset the buffer.
    const tags: string[] = this.tags.filter(onlyUnique)
    this.tags = []

    // Reset the timeout.
    this.timeout = null

    // Loop over all enabled caches.
    let key: keyof MultiCacheInstances
    for (key in this.cacheContext) {
      const cache = this.cacheContext[key]
      if (cache) {
        // Get the keys of all cache items.
        const cacheItemKeys = await cache.storage.getKeys()
        // Loop over all keys and load the value.
        for (const cacheKey of cacheItemKeys) {
          const itemCacheTags = await this.getCacheTags(key, cacheKey)
          if (itemCacheTags) {
            // Determine if the cache item should be removed.
            const shouldPurge = itemCacheTags.some((v) => {
              return tags.includes(v)
            })
            if (shouldPurge) {
              await cache.storage.removeItem(cacheKey)
            }
          }
        }
      }
    }

    return true
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
export default defineEventHandler<Promise<CachePurgeTagsResponse>>(
  async (event) => {
    await checkAuth(event)
    const tags = await getTagsToPurge(event)

    if (!invalidator.cacheContext) {
      const app = useMultiCacheApp()
      invalidator.cacheContext = app.cache
      invalidator.setDelay(cacheTagInvalidationDelay)
    }

    invalidator.add(tags)

    return {
      status: 'OK',
      tags,
    }
  },
)
