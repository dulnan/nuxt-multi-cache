export interface CacheTagInvalidator {
  /**
   * Add cache tags to be invalidated.
   *
   * The implementation is responsible for:
   * - Storing the tags (in-memory, MongoDB, Redis, etc.)
   * - Managing the invalidation timing (debounce, queue, immediate, etc.)
   * - Performing the actual invalidation logic
   *
   * @param tags - Array of cache tags to invalidate
   */
  add(tags: string[]): void
}
