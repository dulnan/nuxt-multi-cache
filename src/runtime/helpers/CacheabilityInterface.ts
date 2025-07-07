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
}
