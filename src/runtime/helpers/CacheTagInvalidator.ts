import { cacheTagInvalidationDelay } from '#nuxt-multi-cache/config'
import type { CacheTagRegistry, CacheType, MultiCacheInstances } from '../types'
import {
  decodeComponentCacheItem,
  decodeRouteCacheItem,
  handleRawCacheData,
} from './cacheItem'

/**
 * A helper class to debounce cache tag invalidation.
 *
 * This prevents having too many invalidation requests coming in at once that
 * could lead to performance issues since tag invalidation can be very
 * inefficient.
 */
export class CacheTagInvalidator {
  /**
   * Buffer of tags to invalidate in the next run.
   */
  private tags: Set<string> = new Set()

  /**
   * The current timeout ID for the next run. Reset after each run.
   */
  private timeout: NodeJS.Timeout | null = null

  constructor(
    /**
     * The caches.
     */
    private cache: MultiCacheInstances,
    /**
     * The cache tag registry.
     */
    private cacheTagRegistry: CacheTagRegistry | null,
  ) {}

  /**
   * Add tags to be purged.
   */
  add(tags: string[] = []) {
    tags.forEach((tag) => {
      if (!this.tags.has(tag)) {
        this.tags.add(tag)
      }
    })

    // Create a timeout to delay the actual invalidation.
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.invalidate()
      }, cacheTagInvalidationDelay)
    }
  }

  async getCacheTags(
    cacheName: keyof MultiCacheInstances,
    key: string,
  ): Promise<string[] | undefined> {
    if (cacheName === 'data') {
      const item = await this.cache[cacheName]?.storage.getItem(key)
      if (item && typeof item === 'object' && item !== null) {
        return (item as any).cacheTags
      }
    } else if (cacheName === 'route') {
      const cached = handleRawCacheData(
        await this.cache[cacheName]?.storage.getItemRaw(key),
      )
      if (cached) {
        return decodeRouteCacheItem(cached)?.cacheTags
      }
    } else if (cacheName === 'component') {
      const cached = handleRawCacheData(
        await this.cache[cacheName]?.storage.getItemRaw(key),
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
    // Get the tags to invalidate and reset the buffer.
    const tags: string[] = [...this.tags.values()]
    this.tags.clear()

    // Reset the timeout.
    this.timeout = null

    // Use the cache tag registry if provided.
    if (this.cacheTagRegistry) {
      const invalidationMap =
        await this.cacheTagRegistry.getCacheKeysForTags(tags)
      let cacheType: CacheType
      for (cacheType in invalidationMap) {
        const keys = invalidationMap[cacheType]!
        const cache = this.cache[cacheType]
        if (cache) {
          for (const item of keys) {
            await cache.storage.removeItem(item)
          }
        }
      }

      await this.cacheTagRegistry.removeTags(tags)

      return true
    }

    // Inefficient fallback: Loop over all caches and cache items.
    let key: keyof MultiCacheInstances
    for (key in this.cache) {
      const cache = this.cache[key]
      if (!cache) {
        continue
      }

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

    return true
  }
}
