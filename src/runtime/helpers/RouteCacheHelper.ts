import { CacheHelper } from './CacheHelper'

export class NuxtMultiCacheRouteCacheHelper extends CacheHelper {
  /**
   * The stale if error age.
   */
  staleIfError: number | null = null

  /**
   * Whether a stale response can be served during revalidation.
   */
  staleWhileRevalidate: boolean | null = null

  /**
   * Set the staleIfError in seconds.
   *
   * If set, then a stale route will be served if that refreshed route throws an error.
   */
  setStaleIfError(v = 0): NuxtMultiCacheRouteCacheHelper {
    // @ts-expect-error TS is not able to determine the type here because the base class uses this in the generic.
    return this.setNumeric('staleIfError', v)
  }

  /**
   * Sets whether a stale respones can be returned while a new one is being generated.
   */
  allowStaleWhileRevalidate(): NuxtMultiCacheRouteCacheHelper {
    this.staleWhileRevalidate = true
    return this
  }
}
