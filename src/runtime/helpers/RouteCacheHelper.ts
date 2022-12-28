export class NuxtMultiCacheRouteCacheHelper {
  /**
   * The collected cache tags.
   */
  tags: string[]

  /**
   * Indicates if the route should be cacheable.
   */
  cacheable: boolean | null

  /**
   * The maximum age.
   */
  maxAge: number | null

  constructor() {
    this.tags = []
    this.cacheable = null
    this.maxAge = null
  }

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
   * Set the max age in seconds.
   *
   * The value is only set if it's smaller than the current max age or if it
   * hasn't been set yet. The initial value is `null`.
   *
   * You can always directly set the maxAge property on this object.
   */
  setMaxAge(maxAge = 0): NuxtMultiCacheRouteCacheHelper {
    // Only set the maxAge if the value is smaller than the current.
    if (!this.maxAge || maxAge < this.maxAge) {
      this.maxAge = maxAge
    }
    return this
  }
}
