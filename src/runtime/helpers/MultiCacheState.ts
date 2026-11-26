/**
 * How long a key counts as being revalidated, in milliseconds.
 *
 * A revalidation that takes longer, e.g. a request that never finishes, no
 * longer prevents the next request from revalidating the route.
 */
export const REVALIDATION_TIMEOUT = 60_000

/**
 * How long requests don't wait for the render of a key after one stored
 * nothing, in milliseconds: they would only find nothing stored, e.g. for an
 * uncacheable route.
 */
export const NOT_STORED_TIMEOUT = 60_000

/**
 * Any path can be requested, so all keys are forgotten at this limit.
 */
export const MAX_KEYS_NOT_STORED = 10_000

export class MultiCacheState {
  /**
   * Keys of routes that a request is rendering, with a promise that resolves
   * when the render ends.
   */
  renders = new Map<string, Promise<void>>()

  /**
   * Keys whose last render stored nothing, with the time (in milliseconds)
   * until which requests for them don't wait.
   */
  notStored = new Map<string, number>()

  /**
   * Wait for the render of a key if another request renders it. Else, start
   * rendering it: requests for the key wait until the returned function is
   * called, or until the timeout (in milliseconds).
   */
  async waitOrStartRender(
    key: string,
    timeout: number,
  ): Promise<((stored: boolean) => void) | undefined> {
    const render = this.renders.get(key)
    if (render) {
      if ((this.notStored.get(key) ?? 0) <= Date.now()) {
        await render
      }
      return
    }

    let end = (_stored: boolean) => {}
    const done = new Promise<void>((resolve) => {
      const timer = setTimeout(() => end(false), timeout)
      end = (stored) => {
        clearTimeout(timer)
        resolve()
        if (this.renders.get(key) === done) {
          this.renders.delete(key)
        }
        if (stored) {
          this.notStored.delete(key)
          return
        }
        if (this.notStored.size >= MAX_KEYS_NOT_STORED) {
          this.notStored.clear()
        }
        this.notStored.set(key, Date.now() + NOT_STORED_TIMEOUT)
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
