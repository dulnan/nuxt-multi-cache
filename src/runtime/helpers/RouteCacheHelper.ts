import { CacheHelper } from './CacheHelper'

export class NuxtMultiCacheRouteCacheHelper extends CacheHelper {
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
}
