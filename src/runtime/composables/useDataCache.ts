import { useSSRContext } from 'vue'
import type { NuxtMultiCacheSSRContext } from '../../types'

const PROPERTY = '__MULTI_CACHE'

type AddToCacheMethod<T> = (data: T, tags?: string[]) => void

type CallbackContext<T> = {
  addToCache: AddToCacheMethod<T>
  value?: T
}

export function useDataCache<T>(key: string): Promise<CallbackContext<T>> {
  const dummy: CallbackContext<T> = { addToCache: () => {} }

  if (process.server) {
    try {
      // SSR context should exist at this point, but TS doesn't know that.
      const ssrContext = useSSRContext()
      if (!ssrContext) {
        return Promise.resolve(dummy)
      }

      // Get the cache storage. If the module is disabled this will be
      // undefined.
      const multiCache: NuxtMultiCacheSSRContext =
        ssrContext.event?.context?.[PROPERTY]
      if (!multiCache || !multiCache.data) {
        return Promise.resolve(dummy)
      }

      // Try to get the item from cache.
      return multiCache.data.getItem(key).then((value: any) => {
        if (value) {
          return {
            ...dummy,
            // Extract the value. If the item was stored along its cache tags, it
            // will be an object with a cacheTags property.
            value:
              typeof value === 'object' && 'cacheTags' in value
                ? value.data
                : value,
          }
        }

        return {
          addToCache: (data: any, cacheTags: string[] = []) => {
            const item = cacheTags.length ? { data, cacheTags } : data
            return multiCache.data!.setItem(key, item).then(() => {
              return data
            })
          },
        }
      })
    } catch (e) {
      // For some reason cache is not available.
      console.debug(e)
    }
  }

  // Return the dummy object to be used in client bundles.
  return Promise.resolve(dummy)
}
