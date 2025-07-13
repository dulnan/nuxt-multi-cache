import { CacheHelper } from './CacheHelper'

export const INJECT_COMPONENT_CACHE_CONTEXT = Symbol(
  'multi_cache_component_cache_helper',
)

export class ComponentCacheHelper extends CacheHelper {
  payloadKeys: string[] = []

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
}
