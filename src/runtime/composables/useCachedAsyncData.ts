import type { NuxtApp, AsyncDataOptions, AsyncData, NuxtError } from 'nuxt/app'
import type { MaybeRefOrGetter } from 'vue'
import type {
  DefaultAsyncDataErrorValue,
  DefaultAsyncDataValue,
} from '#app/defaults'
import type { PickFrom } from '#app/composables/asyncData'
import {
  useAsyncData,
  useDataCache,
  useNuxtApp,
  toValue,
  computed,
} from '#imports'
import {
  CACHE_PERMANENT,
  CACHE_NEVER,
  parseMaxAge,
  type MaxAge,
  toTimestamp,
} from '../helpers/maxAge'

type KeysOf<T> = Array<
  T extends T ? (keyof T extends string ? keyof T : never) : never
>

type ValueOrMethod<T extends number | string[] | undefined | MaxAge, ResT> =
  | ((v: ResT) => T)
  | T

type CachedAsyncDataOptions<
  ResT,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = DefaultAsyncDataValue,
> = Omit<AsyncDataOptions<ResT, DataT, PickKeys, DefaultT>, 'getCachedData'> & {
  /**
   * The client-side max age in seconds.
   *
   * If undefined or 0, nothing will be cached. To cache permanently, define 'permanent' or -1.
   *
   * If a positive integer value is provided, the composable will return
   * cached data (either from payload or from previous client-side
   * fetches) for the given duration.
   */
  clientMaxAge: MaxAge

  /**
   * The server-side max age in seconds.
   *
   * Can be a number or a method that receives the result of your useAsyncData
   * handler and should return a number.
   *
   * If undefined or 0, nothing will be cached. To cache permanently, define 'permanent' or -1.
   */
  serverMaxAge: ValueOrMethod<MaxAge, ResT>

  /**
   * The server-side cache tags to use.
   *
   * Can be an array of strings or a method that receives the result of your useAsyncData
   * handler and should return an array of strings.
   */
  serverCacheTags?: ValueOrMethod<string[], ResT>
}

/**
 * Type for the item we store client-side in nuxtApp.static.data.
 */
type ClientSideCachedAsyncData<DataT> = {
  /**
   * The transformed data.
   */
  data: DataT

  /**
   * The timestamp in milliseconds when the cache item will expire.
   */
  expires: number
}

function getClientSideCachedData<DataT>(
  key: string,
  app: NuxtApp,
): ClientSideCachedAsyncData<DataT> | undefined {
  return app.static.data[key]
}

/**
 * Resolves the value for options that can either be a value or method.
 */
function valueOrMethod<T extends number | string[] | MaxAge, ResT>(
  value: ValueOrMethod<T, ResT> | undefined,
  result: ResT,
): T | undefined {
  if (typeof value === 'function') {
    return value(result)
  }
  return value
}

function isValidMaxAge(v?: unknown): v is number {
  return typeof v === 'number' && (v >= 1 || v === CACHE_PERMANENT)
}

export function useCachedAsyncData<
  ResT,
  NuxtErrorDataT = unknown,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = undefined,
>(
  key: MaybeRefOrGetter<string>,
  handler: (ctx?: NuxtApp) => Promise<ResT>,
  options: CachedAsyncDataOptions<ResT, DataT, PickKeys, DefaultT>,
): AsyncData<
  PickFrom<DataT, PickKeys> | DefaultT,
  | (NuxtErrorDataT extends Error | NuxtError
      ? NuxtErrorDataT
      : NuxtError<NuxtErrorDataT>)
  | DefaultAsyncDataErrorValue
>

export function useCachedAsyncData<
  ResT,
  NuxtErrorDataT = unknown,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = DataT,
>(
  key: MaybeRefOrGetter<string>,
  handler: (ctx?: NuxtApp) => Promise<ResT>,
  options: CachedAsyncDataOptions<ResT, DataT, PickKeys, DefaultT>,
): AsyncData<
  PickFrom<DataT, PickKeys> | DefaultT,
  | (NuxtErrorDataT extends Error | NuxtError
      ? NuxtErrorDataT
      : NuxtError<NuxtErrorDataT>)
  | DefaultAsyncDataErrorValue
>

/**
 * Wrapper around useAsyncData and useDataCache.
 *
 * By default, the data is indefinitely cached on the server side. When the `
 * serverMaxAge` option is provided, you can define a max age for server-side
 * caching.
 *
 * If you want to extend caching to the client-side, provide a `clientMaxAge`
 * value. This will cache the result in Nuxt's static data cache. The cache is
 * not permanent, e.g. a browser refresh "purges" all cached data.
 *
 * @param {string} _key The key used for both useAsyncData and useDataCache.
 * @param {Function} handler The handler that should fetch the data.
 * @param {CachedAsyncDataOptions} options The options.
 */
export function useCachedAsyncData<
  ResT,
  NuxtErrorDataT = unknown,
  DataT = ResT,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
>(
  _key: MaybeRefOrGetter<string>,
  handler: (app?: NuxtApp) => Promise<ResT>,
  options: CachedAsyncDataOptions<ResT, DataT, PickKeys, DefaultT> = {
    clientMaxAge: 0,
    serverMaxAge: 0,
  },
): AsyncData<
  PickFrom<DataT, PickKeys> | DefaultT,
  | (NuxtErrorDataT extends Error | NuxtError
      ? NuxtErrorDataT
      : NuxtError<NuxtErrorDataT>)
  | DefaultAsyncDataErrorValue
> {
  const reactiveKey = computed(() => toValue(_key))

  // Client-side behaviour is slightly different than server side.
  // On the client, the result is cached in a static cache.
  if (import.meta.client) {
    const app = useNuxtApp()

    // Store the timestamp when the page was first hydrated.
    if (!app.static.data.__firstHydrationTime) {
      app.static.data.__firstHydrationTime = Date.now()
    }

    return useAsyncData<ResT, any, DataT, PickKeys, DefaultT>(
      reactiveKey,
      async () => {
        const now = toTimestamp(new Date())
        const result = await handler(app)

        // We already transform the data here so that we can store the
        // transformed data in the cache.
        const data = options?.transform
          ? await options.transform(result)
          : (result as DataT)

        const maxAge = options.clientMaxAge
          ? parseMaxAge(options.clientMaxAge, now)
          : null

        // If a value is provided, we may also cache it client side.
        if (isValidMaxAge(maxAge)) {
          const cacheItem: ClientSideCachedAsyncData<DataT> = {
            data,
            expires: Date.now() + maxAge * 1000,
          }
          app.static.data[reactiveKey.value] = cacheItem
        }

        // Casting is required here because we have already transformed the value
        // and will not transform it again.
        return data as any as ResT
      },
      {
        ...options,
        // Override this option because we call it manually.
        transform: undefined,

        // Also override this method because we need it.
        // The custom type for the options omits this property.
        getCachedData(key, nuxtApp, context) {
          const isRefresh =
            context.cause === 'refresh:manual' ||
            context.cause === 'refresh:hook'

          // Never return from cache when refreshing.
          if (isRefresh) {
            return
          }

          // Get from payload cache.
          const payloadData: DataT | undefined = nuxtApp.payload.data[key]

          // Replicate the default behaviour from Nuxt: The data from the
          // payload is always used during hydration.
          if (payloadData && app.isHydrating) {
            return payloadData
          }

          // No valid clientMaxAge is provided: Nothing is returned from client cache.
          if (!isValidMaxAge(options.clientMaxAge)) {
            return
          }

          // We have a payload, but are not hydrating.
          if (payloadData) {
            // The expires date for payload items is determined by the time
            // the page was first hydrated.
            const firstHydrationTime: number =
              nuxtApp.static.data.__firstHydrationTime

            // The expire value has to be calculated dynamically.
            const expires = firstHydrationTime + options.clientMaxAge * 1000

            // Payload data is not yet expired.
            if (expires > Date.now()) {
              return payloadData
            }
          }

          // Check whether we have something in the static cache.
          const staticCache = getClientSideCachedData(key, app)
          if (staticCache) {
            const expires = staticCache.expires

            // Static cached data not expired, return it.
            if (expires > Date.now()) {
              return staticCache.data
            }
          }

          return undefined as any
        },
      },
    )
  }

  // Code for server-side caching.
  return useAsyncData<ResT, any, DataT, PickKeys, DefaultT>(
    reactiveKey,
    async (app) => {
      const { value, addToCache } = await useDataCache<DataT>(
        reactiveKey.value,
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
      const cacheTags = valueOrMethod(options?.serverCacheTags, result)

      // Get the max age.
      const providedMaxAge =
        valueOrMethod(options?.serverMaxAge, result) ?? CACHE_NEVER

      // We transform the data here, so we can store it in the cache.
      const data = options?.transform
        ? await options.transform(result)
        : (result as DataT)

      // Add the item to the cache.
      await addToCache(data, cacheTags, providedMaxAge)

      // Again, we have to cast it here because the transform method was called
      // manually and is not called again by Nuxt.
      return data as any as ResT
    },
    {
      ...options,
      transform: undefined,
      getCachedData: undefined,
    },
  )
}
