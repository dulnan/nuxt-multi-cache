import type { CacheableItemInterface } from '../types'
import type { CacheabilityInterface } from './CacheabilityInterface'
import {
  CACHE_NEVER,
  CACHE_PERMANENT,
  expiresToMaxAge,
  parseMaxAge,
  type MaxAge,
} from './maxAge'

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number | null ? K : never
}[keyof T]

export class CacheHelper implements CacheabilityInterface {
  /**
   * The collected cache tags.
   */
  tags: string[] = []

  /**
   * Indicates if it should be cacheable.
   */
  cacheable: boolean | null = null

  /**
   * The maximum age.
   */
  maxAge = CACHE_PERMANENT

  /**
   * The stale if error age.
   */
  staleIfError: number | null = null

  constructor(private readonly now: number) {}

  /**
   * Set a numeric property, but **only** when the new value is
   * lower than the existing one (or the property is still `null`).
   *
   * `property` is restricted to *numeric* properties of **whatever
   * concrete class `this` is*.  That includes fields that subclasses
   * add later.
   */
  setNumeric<K extends NumericKeys<this>>(
    property: K,
    providedValue: MaxAge,
  ): this {
    const current = this[property] as number | null

    const value = parseMaxAge(providedValue, this.now)

    if (current === null || value < current || current === -1) {
      // @ts-expect-error It's correct, but TS doesn't know.
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
  setMaxAge(v: MaxAge): this {
    // @ts-expect-error TS is not able to determine the type here because the base class uses this in the generic.
    return this.setNumeric('maxAge', v)
  }

  /**
   * Set the staleIfError in seconds.
   *
   * If set, then a stale version of the component may be returned if an error happens during rendering.
   */
  setStaleIfError(v: MaxAge): this {
    // @ts-expect-error TS is not able to determine the type here because the base class uses this in the generic.
    return this.setNumeric('staleIfError', v)
  }

  /**
   * Add cache tags for this route.
   */
  addTags(tags: string[] | string = []): this {
    if (Array.isArray(tags)) {
      this.tags.push(...tags)
    } else if (typeof tags === 'string') {
      this.tags.push(tags)
    }
    return this
  }

  /**
   * Mark this item as cacheable.
   *
   * The initial value is null and this method only changes the value if it is
   * null. This means that once it's set to uncacheable, there is no way to
   * change it back.
   */
  setCacheable(): this {
    // Only set it to cacheable if it's in the initial state.
    if (this.cacheable === null) {
      this.cacheable = true
    }
    return this
  }

  /**
   * Mark the item as uncacheable.
   *
   * After that there is no way to make it cacheable again.
   */
  setUncacheable(): this {
    // Setting to false is always possible.
    this.cacheable = false
    return this
  }

  /**
   * Get the expire timestamp as unix epoch (seconds).
   */
  getExpires<K extends NumericKeys<this>>(property: K): number | undefined {
    const value = this[property] as number | null

    if (value === null) {
      return
    } else if (value === CACHE_PERMANENT || value === CACHE_NEVER) {
      return value
    }

    return this.now + value
  }

  /**
   * Whether the item is cacheable.
   */
  public isCacheable(): boolean {
    return this.cacheable === true
  }

  public mergeFromCacheItem(item: CacheableItemInterface): this {
    if (item.cacheTags) {
      this.addTags(item.cacheTags)
    }

    if (item.expires !== null && item.expires !== undefined) {
      this.setMaxAge(expiresToMaxAge(item.expires, this.now))
    }

    if (
      item.staleIfErrorExpires !== null &&
      item.staleIfErrorExpires !== undefined
    ) {
      this.setStaleIfError(expiresToMaxAge(item.staleIfErrorExpires, this.now))
    }

    return this
  }

  public getMaxAge(): number {
    return this.maxAge
  }

  public getStaleIfError(): number | null {
    return this.staleIfError
  }

  public getTags(): string[] {
    return this.tags
  }

  public mergeFromCacheability(cacheability: CacheabilityInterface): this {
    const maxAge = cacheability.getMaxAge()
    if (maxAge !== null) {
      this.setMaxAge(maxAge)
    }

    const staleIfError = cacheability.getStaleIfError()
    if (staleIfError !== null) {
      this.setStaleIfError(staleIfError)
    }

    this.addTags(cacheability.getTags())
    return this
  }
}
