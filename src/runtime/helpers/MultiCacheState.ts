/**
 * How long a key counts as being revalidated, in milliseconds.
 *
 * A revalidation that takes longer, e.g. a request that never finishes, no
 * longer prevents the next request from revalidating the route.
 */
export const REVALIDATION_TIMEOUT = 60_000

/**
 * How long requests wait for the render of a route, in milliseconds.
 *
 * After it, they render the route themselves, e.g. if the render never ends.
 */
export const RENDER_TIMEOUT = 5_000

export class MultiCacheState {
  /**
   * Keys of routes that a request is rendering, with a promise that resolves
   * when the render ends.
   */
  renders = new Map<string, Promise<void>>()

  /**
   * Start rendering a key, unless another request is rendering it.
   *
   * @returns A function that ends the render, or undefined.
   */
  startRender(key: string): (() => void) | undefined {
    if (this.renders.has(key)) {
      return
    }

    let resolve = () => {}
    const done = new Promise<void>((r) => {
      resolve = r
    })
    const end = () => {
      clearTimeout(timer)
      resolve()
      if (this.renders.get(key) === done) {
        this.renders.delete(key)
      }
    }
    const timer = setTimeout(end, RENDER_TIMEOUT)
    this.renders.set(key, done)
    return end
  }

  /**
   * Wait until the render of a key ends, if another request is rendering it.
   *
   * @returns Whether it waited.
   */
  async waitForRender(key: string): Promise<boolean> {
    const render = this.renders.get(key)
    if (!render) {
      return false
    }
    await render
    return true
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
