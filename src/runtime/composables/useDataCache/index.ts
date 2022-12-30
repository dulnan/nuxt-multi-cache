import { useSSRContext } from 'vue'
import type { H3Event } from 'h3'
import { getMultiCacheContext } from '../../helpers/server'

type AddToCacheMethod<T> = (data: T, tags?: string[]) => Promise<void>
type DataCacheItem = { data: any; cacheTags: string[] } | string

type CallbackContext<T> = {
  addToCache: AddToCacheMethod<T>
  value?: T
  cacheTags: string[]
}

export function useDataCache<T>(
  key: string,
  providedEvent?: H3Event,
): Promise<CallbackContext<T>> {
  // Dummy argument for the callback used when something goes wrong accessing
  // the cache or on client side.
  const dummy: CallbackContext<T> = {
    addToCache: () => {
      return Promise.resolve()
    },
    cacheTags: [] as string[],
  }

  // Code only available on server side.
  if (process.server) {
    try {
      const event: H3Event = (() => {
        // Event provided by user.
        if (providedEvent) {
          return providedEvent
        }

        // SSR context should exist at this point, but TS doesn't know that.
        const ssrContext = useSSRContext()
        if (ssrContext) {
          return ssrContext.event
        }
      })()

      const multiCache = getMultiCacheContext(event)
      // Get the cache storage. If the module is disabled this will be
      // undefined.
      if (!multiCache?.data) {
        return Promise.resolve(dummy)
      }

      // Try to get the item from cache.
      return multiCache.data.getItem(key).then((v: any) => {
        const value = v as DataCacheItem
        const addToCache = (data: any, cacheTags: string[] = []) => {
          const item = cacheTags.length ? { data, cacheTags } : data
          return multiCache.data!.setItem(key, item).then(() => {
            return data
          })
        }
        if (typeof value === 'object') {
          return {
            addToCache,
            // Extract the value. If the item was stored along its cache tags, it
            // will be an object with a cacheTags property.
            value: value.data,
            cacheTags: value.cacheTags,
          }
        } else if (typeof value === 'string') {
          return {
            addToCache,
            value,
            cacheTags: [],
          }
        }

        return {
          addToCache,
          cacheTags: [],
        }
      })
    } catch (e) {
      if (e instanceof Error) {
        // For some reason cache is not available.
        console.debug(e.message)
      }
    }
  }

  // Return the dummy object to be used in client bundles.
  return Promise.resolve(dummy)
}
