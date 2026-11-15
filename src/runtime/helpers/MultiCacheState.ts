/**
 * How long a key counts as being revalidated, in milliseconds.
 *
 * A revalidation that takes longer, e.g. a request that never finishes, no
 * longer prevents the next request from revalidating the route.
 */
export const REVALIDATION_TIMEOUT = 60_000

/**
 * How long concurrent requests wait for a route that another request renders,
 * in milliseconds.
 *
 * A render normally ends when its response is sent. This only limits the wait
 * for a render that never finishes, e.g. one that waits for a request without
 * a timeout: after it, the waiting requests render the route themselves, and
 * the next request can render it again.
 */
export const RENDER_TIMEOUT = 5_000

/**
 * How long requests don't wait for the render of a key after one stored
 * nothing or timed out, in milliseconds.
 *
 * Waiting requests would only find nothing stored and render the route
 * themselves, e.g. for an uncacheable route. Each render of the key that
 * stores nothing starts this time again, and one that stores the route ends
 * it.
 */
export const NOT_STORED_TIMEOUT = 60_000

/**
 * How many keys whose render stored nothing are kept.
 *
 * Any path can be requested, e.g. paths that respond with a 404, so the oldest
 * key is removed when another one is added. A removed key's requests wait
 * again.
 */
export const MAX_KEYS_NOT_STORED = 10_000

type Render = {
  startedAt: number
  done: Promise<void>
  finish: () => void
}

export class MultiCacheState {
  /**
   * Keys of routes that a request is currently rendering, for requests that
   * wait for the result instead of rendering the route too.
   */
  renders = new Map<string, Render>()

  /**
   * Keys whose last render stored nothing or timed out, with the time (in
   * milliseconds) when it ended.
   */
  keysNotStored = new Map<string, number>()

  /**
   * Start rendering a key.
   *
   * @returns A function that ends the render, with whether the route was
   *   stored, or null if another request is already rendering the key.
   */
  startRender(key: string): ((stored: boolean) => void) | null {
    const current = this.renders.get(key)
    if (current) {
      if (Date.now() - current.startedAt <= RENDER_TIMEOUT) {
        return null
      }

      // Requests still waiting for a render that timed out stop waiting, and
      // the next ones don't wait for this key.
      this.addKeyNotStored(key)
      current.finish()
    }

    let finish = () => {}
    const done = new Promise<void>((resolve) => {
      finish = resolve
    })
    const render: Render = { startedAt: Date.now(), done, finish }
    this.renders.set(key, render)

    return (stored: boolean) => {
      if (stored) {
        this.keysNotStored.delete(key)
      } else {
        this.addKeyNotStored(key)
      }

      render.finish()
      // A render that timed out may have been replaced by a newer one.
      if (this.renders.get(key) === render) {
        this.renders.delete(key)
      }
    }
  }

  /**
   * Remember that a render of a key stored nothing or timed out.
   */
  addKeyNotStored(key: string) {
    // Added again at the end, so that the oldest key comes first.
    this.keysNotStored.delete(key)
    this.keysNotStored.set(key, Date.now())

    if (this.keysNotStored.size > MAX_KEYS_NOT_STORED) {
      const oldest = this.keysNotStored.keys().next().value
      if (oldest !== undefined) {
        this.keysNotStored.delete(oldest)
      }
    }
  }

  /**
   * Whether a recent render of a key stored nothing or timed out.
   */
  wasNotStored(key: string): boolean {
    const endedAt = this.keysNotStored.get(key)
    if (endedAt === undefined) {
      return false
    }

    if (Date.now() - endedAt > NOT_STORED_TIMEOUT) {
      this.keysNotStored.delete(key)
      return false
    }

    return true
  }

  /**
   * Wait until the render of a key ends, or at most RENDER_TIMEOUT.
   */
  async waitForRender(key: string): Promise<void> {
    const render = this.renders.get(key)
    if (!render) {
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    const timedOut = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, RENDER_TIMEOUT)
    })
    await Promise.race([render.done, timedOut])
    clearTimeout(timer)
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
