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
   * Start rendering a key.
   *
   * @returns A function that ends the render, or null if another request is
   *   already rendering the key.
   */
  startRender(key: string): (() => void) | null {
    const current = this.renders.get(key)
    if (current && Date.now() - current.startedAt <= RENDER_TIMEOUT) {
      return null
    }

    // Requests still waiting for a render that timed out stop waiting.
    current?.finish()

    let finish = () => {}
    const done = new Promise<void>((resolve) => {
      finish = resolve
    })
    const render: Render = { startedAt: Date.now(), done, finish }
    this.renders.set(key, render)

    return () => {
      render.finish()
      // A render that timed out may have been replaced by a newer one.
      if (this.renders.get(key) === render) {
        this.renders.delete(key)
      }
    }
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
