export interface CacheabilityInterface {
  /**
   * Return the max age.
   */
  getMaxAge(): number | null

  /**
   * Get the staleIfError value.
   */
  getStaleIfError(): number | null

  /**
   * Get the cache tags.
   */
  getTags(): string[]

  /**
   * Whether it's cacheable: false if it was explicitly marked as uncacheable,
   * null if it was never set.
   */
  getCacheable(): boolean | null
}
