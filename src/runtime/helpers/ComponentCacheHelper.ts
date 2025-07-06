import { CacheHelper } from './CacheHelper'
import type { MaxAge } from './maxAge'

export const INJECT_COMPONENT_CACHE_CONTEXT = Symbol(
  'multi_cache_component_cache_helper',
)

export class ComponentCacheHelper extends CacheHelper {
  payloadKeys: string[] = []

  /**
   * The stale if error age.
   */
  staleIfError: number | null = null

  /**
   * Add payload keys for which the value should be extracted and stored
   * in cache.
   */
  public addPayloadKeys(keys: string | string[]): this {
    if (Array.isArray(keys)) {
      this.payloadKeys.push(...keys)
    } else if (typeof keys === 'string') {
      this.payloadKeys.push(keys)
    }

    return this
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
}
