/**
 * How long a key counts as being revalidated, in milliseconds.
 *
 * A revalidation that takes longer, e.g. a request that never finishes, no
 * longer prevents the next request from revalidating the route.
 */
export const REVALIDATION_TIMEOUT = 60_000

/**
 * How long requests wait for the render of a route, in milliseconds.
 */
export const RENDER_TIMEOUT = 5_000

export class MultiCacheState {
  /**
   * Keys of routes that a request is rendering, with a promise that resolves
   * when the render ends.
   */
  renders = new Map<string, Promise<void>>()

  /**
   * Wait for the render of a key if another request renders it. Else, start
   * rendering it: requests for the key wait until the returned function is
   * called, or until the timeout.
   */
  async waitOrStartRender(key: string): Promise<(() => void) | undefined> {
    const render = this.renders.get(key)
    if (render) {
      await render
      return
    }

    let end = () => {}
    const done = new Promise<void>((resolve) => {
      const timer = setTimeout(() => end(), RENDER_TIMEOUT)
      end = () => {
        clearTimeout(timer)
        resolve()
        if (this.renders.get(key) === done) {
          this.renders.delete(key)
        }
      }
    })
    this.renders.set(key, done)
    return end
  }

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
