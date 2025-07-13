import type { CacheType } from '.'

export interface CacheTagRegistry {
  /**
   * Return which cache item keys to invalidate for the given cache tags.
   *
   * @param tags - The cache tags that will be invalidated.
   *
   * @returns An object with the cache types as properties and the cache item
   * keys as values.
   *
   * @example
   * ```
   * {
   *   data: ['load-users:de', 'global-config'],
   *   component: ['PageFooter::anonymous:de', 'HeroTeaser::38d38ac58'],
   *   route: ['de--products--583'],
   * }
   * ```
   */
  getCacheKeysForTags(
    tags: string[],
  ): Promise<Partial<Record<CacheType, string[]>>>

  /**
   * Removes the given cache tags from the registry.
   *
   * The method is called after getCacheKeysForTags() when the tags have
   * been successfully invalidated.
   */
  removeTags(tags: string[]): Promise<void>

  /**
   * Remove all item keys of the given cache type.
   *
   * Called when a single cache is purged.
   */
  purgeCache(cacheType: CacheType): Promise<void>

  /**
   * Remove all item keys.
   *
   * Called when all caches are purged.
   */
  purgeEverything(): Promise<void>

  /**
   * Remove a cache item.
   */
  removeCacheItem(cacheType: CacheType, key: string | string[]): Promise<void>

  /**
   * Assign one or more cache tags to the given cache item key.
   */
  addCacheTags(
    cacheItemKey: string,
    cacheType: CacheType,
    cacheTags: string[],
  ): Promise<void>
}
