import type { H3Event } from 'h3'
import type { UseDataCacheCallbackCallback } from '../server/utils/useDataCacheCallback'
import { useDataCacheCallback as serverUseDataCacheCallback } from '../server/utils/useDataCacheCallback'
import { useNuxtApp } from '#imports'
import { logger } from '../helpers/multi-cache-logger'
import { debug, isServer } from '#nuxt-multi-cache/config'
import type { UseDataCacheOptions } from '../server/utils/useDataCache'

export async function useDataCacheCallback<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  providedEvent?: H3Event | null,
  options?: UseDataCacheOptions,
): Promise<T> {
  if (isServer) {
    const event = providedEvent || useNuxtApp().ssrContext?.event

    if (event) {
      return serverUseDataCacheCallback(key, cb, event, options)
    } else {
      if (debug) {
        logger.warn(
          'No H3Event provided while not in Nuxt context when calling useDataCache for key: ' +
            key,
        )
      }
    }
  }

  const result = await cb()
  return result
}
