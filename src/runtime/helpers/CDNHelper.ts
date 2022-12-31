import { CacheControl } from '@tusbar/cache-control'

type CacheControlProperties = keyof Omit<CacheControl, 'private' | 'public'>
type CacheControlNumericProperties = keyof Pick<
  CacheControl,
  | 'maxAge'
  | 'sharedMaxAge'
  | 'maxStaleDuration'
  | 'minFresh'
  | 'staleWhileRevalidate'
  | 'staleIfError'
>

export class NuxtMultiCacheCDNHelper {
  _tags: string[]
  _control: CacheControl

  constructor() {
    this._tags = []
    this._control = new CacheControl()
  }

  /**
   * Set a cache-control property.
   */
  set<T extends CacheControlProperties>(
    key: T,
    value: CacheControl[T],
  ): NuxtMultiCacheCDNHelper {
    this._control[key] = value
    return this
  }

  /**
   * Add cache tags.
   */
  addTags(tags: string[]): NuxtMultiCacheCDNHelper {
    this._tags.push(...tags)
    return this
  }

  /**
   * Sets a numeric value only if it's lower than the current value or if it
   * isn't yet set.
   *
   * For example, this can be used when setting maxAge: You can set a global
   * max age of 1 year for every response. But a component down the tree that
   * shows the current weather can set it to 1 hour. If another component tries
   * to set the max age to 7 days the value won't be set.
   *
   * This basically means that the lowest value will always "win".
   */
  setNumeric<T extends CacheControlNumericProperties>(
    key: T,
    value: number,
  ): NuxtMultiCacheCDNHelper {
    const currentValue = this._control[key]
    if (
      currentValue === null ||
      currentValue === undefined ||
      value < currentValue
    ) {
      this._control[key] = value
    }
    return this
  }

  /**
   * Set as private.
   *
   * Note that once it's set to private you can't change it back to public.
   * This is so that it's possible to change it at any time during the request
   * without running into race conditions.
   */
  private(): NuxtMultiCacheCDNHelper {
    this._control.private = true
    this._control.public = false
    return this
  }

  /**
   * Set public.
   *
   * Note that if `private` was already set to `true` this will have no effect.
   */
  public(): NuxtMultiCacheCDNHelper {
    if (!this._control.private) {
      this._control.public = true
    }
    return this
  }
}
