import type { H3Event } from 'h3'
import { logger } from '../helpers/multi-cache-logger'
import type { DataCacheCallbackContext } from '../types'
import {
  useDataCache as serverUseDataCache,
  type UseDataCacheOptions,
} from './../server/utils/useDataCache'
import { useNuxtApp } from '#imports'
import { debug, isServer } from '#nuxt-multi-cache/config'

export async function useDataCache<T>(
  key: string,
  providedEvent?: H3Event | null,
  options?: UseDataCacheOptions | null,
): Promise<DataCacheCallbackContext<T>> {
  const dummy: DataCacheCallbackContext<T> = {
    addToCache: function () {
      return Promise.resolve()
    },
    cacheTags: [] as string[],
  }

  // Code only available on server side.
  if (!isServer) {
    return dummy
  }

  const event = providedEvent || useNuxtApp().ssrContext?.event

  if (!event) {
    if (debug) {
      logger.warn(
        'No H3Event provided while not in vue context when calling useDataCache for key: ' +
          key,
      )
    }

    return Promise.resolve(dummy)
  }

  return serverUseDataCache(key, event, options)
}
