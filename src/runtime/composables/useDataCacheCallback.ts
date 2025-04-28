import type { H3Event } from 'h3'
import type { UseDataCacheCallbackCallback } from '../server/utils/useDataCacheCallback'
import { useDataCacheCallback as serverUseDataCacheCallback } from '../server/utils/useDataCacheCallback'
import { useNuxtApp } from '#imports'
import { logger } from '../helpers/logger'
import { debug, isServer } from '#nuxt-multi-cache/config'

export async function useDataCacheCallback<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  providedEvent?: H3Event,
): Promise<T> {
  if (isServer) {
    const event = providedEvent || useNuxtApp().ssrContext?.event

    if (event) {
      return serverUseDataCacheCallback(key, cb, event)
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
  return result.value
}
