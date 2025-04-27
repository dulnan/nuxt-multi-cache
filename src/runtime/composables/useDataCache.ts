import type { H3Event } from 'h3'
import { logger } from '../helpers/logger'
import type { DataCacheCallbackContext } from '../types'
import { useDataCache as serverUseDataCache } from './../server/utils/useDataCache'
import { useNuxtApp } from '#imports'
import { debug } from '#nuxt-multi-cache/config'

export function useDataCache<T>(
  key: string,
  providedEvent?: H3Event,
): Promise<DataCacheCallbackContext<T>> {
  const dummy: DataCacheCallbackContext<T> = {
    addToCache: (_v: T) => {
      return Promise.resolve()
    },
    cacheTags: [] as string[],
  }

  const isServer =
    import.meta.env.VITEST_SERVER === 'true' || import.meta.server

  // Code only available on server side.
  if (!isServer) {
    return Promise.resolve(dummy)
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

  return serverUseDataCache(key, event)
}
