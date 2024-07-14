export class NuxtMultiCacheRouteCacheHelper {
  /**
   * The collected cache tags.
   */
  tags: string[] = []

  /**
   * Indicates if the route should be cacheable.
   */
  cacheable: boolean | null = null

  /**
   * The maximum age.
   */
  maxAge: number | null = null

  /**
   * The stale if error age.
   */
  staleIfError: number | null = null

  /**
   * Whether a stale response can be served during revalidation.
   */
  staleWhileRevalidate: boolean | null = null

  /**
   * Add cache tags for this route.
   */
  addTags(tags: string[] = []): NuxtMultiCacheRouteCacheHelper {
    this.tags.push(...tags)
    return this
  }

  /**
   * Mark this route as cacheable.
   *
   * The initial value is null and this method only changes the value if it is
   * null. This means that once it's set to uncacheable, there is no way to
   * change it back.
   */
  setCacheable(): NuxtMultiCacheRouteCacheHelper {
    // Only set it to cacheable if it's in the initial state.
    if (this.cacheable === null) {
      this.cacheable = true
    }
    return this
  }

  /**
   * Mark the route as uncacheable.
   *
   * After that there is no way to make it cacheable again.
   */
  setUncacheable(): NuxtMultiCacheRouteCacheHelper {
    // Setting to false is always possible.
    this.cacheable = false
    return this
  }

  /**
   * Set a numeric value only if its smaller than the existing value.
   */
  setNumeric(
    property: keyof Pick<
      NuxtMultiCacheRouteCacheHelper,
      'maxAge' | 'staleIfError'
    >,
    value: number,
  ): NuxtMultiCacheRouteCacheHelper {
    const current = this[property]

    // Only set the value if the value is smaller than the current.
    if (current === null || value < current) {
      this[property] = value
    }

    return this
  }

  /**
   * Set the max age in seconds.
   *
   * The value is only set if it's smaller than the current max age or if it
   * hasn't been set yet. The initial value is `null`.
   *
   * You can always directly set the maxAge property on this object.
   */
  setMaxAge(v = 0): NuxtMultiCacheRouteCacheHelper {
    return this.setNumeric('maxAge', v)
  }

  /**
   * Set the staleIfError in seconds.
   *
   * If set, then a stale route will be served if that refreshed route throws an error.
   */
  setStaleIfError(v = 0): NuxtMultiCacheRouteCacheHelper {
    return this.setNumeric('staleIfError', v)
  }

  /**
   * Sets whether a stale respones can be returned while a new one is being generated.
   */
  allowStaleWhileRevalidate(): NuxtMultiCacheRouteCacheHelper {
    this.staleWhileRevalidate = true
    return this
  }

  /**
   * Get the expire timestamp as unix epoch (seconds).
   */
  getExpires(
    property: keyof Pick<
      NuxtMultiCacheRouteCacheHelper,
      'maxAge' | 'staleIfError'
    >,
  ): number | undefined {
    const value = this[property]

    if (value === null) {
      return
    }

    return Math.floor(Date.now() / 1000) + value
  }
}
