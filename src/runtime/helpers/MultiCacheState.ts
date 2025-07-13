export class MultiCacheState {
  /**
   * Keys that are currently being revalidated.
   */
  keysBeingRevalidated = new Set<string>()

  /**
   * Add a key that is currently being revalidated.
   */
  addKeyBeingRevalidated(key: string) {
    this.keysBeingRevalidated.add(key)
  }

  /**
   * Remove a key from being revalidated.
   */
  removeKeyBeingRevalidated(key: string) {
    this.keysBeingRevalidated.delete(key)
  }

  /**
   * Check if a key is currentl being revalidated.
   */
  isBeingRevalidated(key: string): boolean {
    return this.keysBeingRevalidated.has(key)
  }
}
