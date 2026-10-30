import { CacheHelper } from './CacheHelper'

export class NuxtMultiCacheRouteCacheHelper extends CacheHelper {
  /**
   * Whether to trigger a background revalidation when a stale cache item is accessed.
   */
  enableBackgroundRevalidation: boolean | null = null

  /**
   * Whether a stale response can be served during revalidation.
   */
  staleWhileRevalidate: boolean | null = null

  /**
   * Sets whether a stale respones can be returned while a new one is being generated.
   */
  allowStaleWhileRevalidate(): NuxtMultiCacheRouteCacheHelper {
    this.staleWhileRevalidate = true
    return this
  }

  /**
   * Allows background revalidation for this route.
   *
   * When enabled, expired routes will serve stale content immediately
   * while revalidating in the background.
   */
  allowBackgroundRevalidation(): NuxtMultiCacheRouteCacheHelper {
    this.enableBackgroundRevalidation = true
    return this
  }
}
