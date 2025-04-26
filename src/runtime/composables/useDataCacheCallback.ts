import type { H3Event } from 'h3'
import type { UseDataCacheCallbackCallback } from '../server/utils/useDataCacheCallback'
import { useDataCacheCallback as serverUseDataCacheCallback } from '../server/utils/useDataCacheCallback'
import { useRuntimeConfig, useNuxtApp } from '#imports'
import { logger } from '../helpers/logger'

export async function useDataCacheCallback<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  providedEvent?: H3Event,
): Promise<T> {
  const isServer =
    import.meta.env.VITEST_SERVER === 'true' || import.meta.server

  if (isServer) {
    const event = providedEvent || useNuxtApp().ssrContext?.event

    if (!event) {
      const { debug } = useRuntimeConfig().multiCache || {}
      if (debug) {
        logger.warn(
          'No H3Event provided while not in Nuxt context when calling useDataCache for key: ' +
            key,
        )
      }
      const result = await cb()
      return result.value
    }

    return serverUseDataCacheCallback(key, cb, event)
  }

  const result = await cb()
  return result.value
}
