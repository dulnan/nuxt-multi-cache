import type { H3Event } from 'h3'
import { useDataCache } from './useDataCache'

type UseDataCacheCallbackReturnValue<T> = {
  value: T
  cacheTags?: string[]
  maxAge?: number
}

export type UseDataCacheCallbackCallback<T> = () =>
  | Promise<UseDataCacheCallbackReturnValue<T>>
  | UseDataCacheCallbackReturnValue<T>

export async function useDataCacheCallback<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  event: H3Event,
): Promise<T> {
  const fromCache = await useDataCache<T>(key, event)

  if (fromCache.value) {
    return fromCache.value
  }

  const result = await cb()
  await fromCache.addToCache(result.value, result.cacheTags, result.maxAge)
  return result.value
}
