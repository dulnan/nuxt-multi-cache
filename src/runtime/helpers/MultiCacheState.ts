export class MultiCacheState {
  /**
   * Keys that are currently being revalidated.
   */
  keysBeingRevalidated: Record<string, boolean> = {}

  /**
   * Add a key that is currently being revalidated.
   */
  addKeyBeingRevalidated(key: string) {
    this.keysBeingRevalidated[key] = true
  }

  /**
   * Remove a key from being revalidated.
   */
  removeKeyBeingRevalidated(key: string) {
    delete this.keysBeingRevalidated[key]
  }

  /**
   * Check if a key is currentl being revalidated.
   */
  isBeingRevalidated(key: string): boolean {
    return this.keysBeingRevalidated[key] === true
  }
}
