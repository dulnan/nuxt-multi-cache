import type { MultiCacheServerOptions } from './runtime/types'

/**
 * Define nuxt-multi-cache server options.
 */
export function defineMultiCacheOptions(
  options: () => MultiCacheServerOptions,
): () => MultiCacheServerOptions

/**
 * Use the signature to pass a method that returns the options instead.
 * @deprecated
 *
 * @example
 * ```typescript
 * export default defineMultiCacheOptions(() => {
 *   return {
 *     // ...
 *   }
 * })
 * ```
 */
export function defineMultiCacheOptions(
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  options: MultiCacheServerOptions,
): () => MultiCacheServerOptions

/**
 * Define nuxt-multi-cache server options.
 */
export function defineMultiCacheOptions(
  options: (() => MultiCacheServerOptions) | MultiCacheServerOptions,
): () => MultiCacheServerOptions {
  if (import.meta.server) {
    if (typeof options === 'function') {
      return options
    }

    return function () {
      return options
    }
  }

  return () => {
    return {}
  }
}
