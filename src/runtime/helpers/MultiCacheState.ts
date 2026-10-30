/**
 * How long a key counts as being revalidated, in milliseconds.
 *
 * A revalidation that takes longer, e.g. a request that never finishes, no
 * longer prevents the next request from revalidating the route.
 */
export const REVALIDATION_TIMEOUT = 60_000

export class MultiCacheState {
  /**
   * Keys that are currently being revalidated, with the time (in
   * milliseconds) when the revalidation started.
   */
  keysBeingRevalidated = new Map<string, number>()

  /**
   * Add a key that is currently being revalidated.
   */
  addKeyBeingRevalidated(key: string) {
    this.keysBeingRevalidated.set(key, Date.now())
  }

  /**
   * Remove a key from being revalidated.
   */
  removeKeyBeingRevalidated(key: string) {
    this.keysBeingRevalidated.delete(key)
  }

  /**
   * Check if a key is currently being revalidated.
   */
  isBeingRevalidated(key: string): boolean {
    const startedAt = this.keysBeingRevalidated.get(key)
    if (startedAt === undefined) {
      return false
    }

    if (Date.now() - startedAt > REVALIDATION_TIMEOUT) {
      this.keysBeingRevalidated.delete(key)
      return false
    }

    return true
  }
}
