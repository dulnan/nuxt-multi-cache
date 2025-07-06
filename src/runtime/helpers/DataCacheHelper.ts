import { CacheHelper } from './CacheHelper'
import type { MaxAge } from './maxAge'

export class DataCacheHelper extends CacheHelper {
  /**
   * The stale if error age.
   */
  staleIfError: number | null = null

  /**
   * Set the staleIfError in seconds.
   *
   * If set, then stale data may be returned for the given duration if the callback results in an error.
   */
  setStaleIfError(v: MaxAge): this {
    // @ts-expect-error TS is not able to determine the type here because the base class uses this in the generic.
    return this.setNumeric('staleIfError', v)
  }
}
