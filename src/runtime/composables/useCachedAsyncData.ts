import type { NuxtApp, AsyncDataOptions } from 'nuxt/app'
import type { DefaultAsyncDataValue } from '#app/defaults'
import { useAsyncData, useDataCache } from '#imports'

type KeysOf<T> = Array<
  T extends T ? (keyof T extends string ? keyof T : never) : never
>

type ValueOrMethod<T extends number | string[] | undefined, ResT> =
  | ((v: ResT) => T)
  | T

type CachedAsyncDataOptions<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = DefaultAsyncDataValue,
> = AsyncDataOptions<ResT, DataT, PickKeys, DefaultT> & {
  /**
   * The max age in seconds for the data cache item.
   *
   * Can be a number or a method that receives the result of your useAsyncData
   * handler and should return a number.
   */
  maxAge?: ValueOrMethod<number, ResT>
  cacheTags?: ValueOrMethod<string[], ResT>
}

/**
 * Resolves the value for options that can either be a value or method.
 */
function valueOrMethod<T extends number | string[], ResT>(
  value: ValueOrMethod<T, ResT> | undefined,
  result: ResT,
): T | undefined {
  if (typeof value === 'function') {
    return value(result)
  }
  return value
}

/**
 * Caches the result of the handler using useDataCache().
 *
 * @param {string} key The key used for both useAsyncData and useDataCache.
 * @param {Function} handler The handler that should fetch the data.
 * @param {CachedAsyncDataOptions|undefined} options
 */
export function useCachedAsyncData<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
>(
  key: string,
  handler: (app?: NuxtApp) => Promise<ResT>,
  options?: CachedAsyncDataOptions<ResT, DataT, PickKeys, DefaultT>,
) {
  // Client-side behaviour is identical to normal useAsyncData, without any
  // custom behaviour from this module.
  if (import.meta.client) {
    return useAsyncData<ResT, unknown, DataT, PickKeys, DefaultT>(
      key,
      () => handler(),
      options,
    )
  }

  return useAsyncData<ResT, unknown, DataT, PickKeys, DefaultT>(
    key,
    async (app) => {
      const { value, addToCache } = await useDataCache<DataT>(
        key,
        app?.ssrContext?.event,
      )

      if (value) {
        // We have to cast it to this type, because normally we would be
        // returning ResT here. Because we removed the `transform` method
        // from the options, this value is not transformed anymore, which
        // is why the casted type is correct.
        return value as ResT
      }

      // Run the handler to get the data.
      const result: Awaited<ResT> = await handler(app)

      // Get the cache tags.
      const cacheTags = valueOrMethod(options?.cacheTags, result)

      // Get the max age.
      const maxAge = valueOrMethod(options?.maxAge, result)

      // We transform the data here, so we can store it in the cache.
      const data = options?.transform
        ? await options.transform(result)
        : (result as DataT)

      // Add the item to the cache.
      await addToCache(data, cacheTags, maxAge)

      // Again, we have to cast it here because the transform method was called
      // manually and is not called again by Nuxt.
      return data as any as ResT
    },
    options && typeof options === 'object'
      ? {
          ...options,
          transform: undefined,
        }
      : undefined,
  )
}
