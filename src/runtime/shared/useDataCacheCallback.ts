import type { H3Event } from 'h3'
import {
  useDataCacheImplementation,
  type UseDataCacheOptions,
} from './useDataCache'
import { DataCacheHelper } from './../helpers/DataCacheHelper'
import { getRequestTimestamp } from './../helpers/server'
import { bubbleCacheability } from './../helpers/bubbleCacheability'

export type UseDataCacheCallbackCallback<T> = (
  helper?: DataCacheHelper,
) => Promise<T> | T

export async function useDataCacheCallbackImplementation<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  event: H3Event,
  options?: UseDataCacheOptions,
): Promise<T> {
  const fromCache = await useDataCacheImplementation<T>(key, event, options)

  // The "value" property contains a value if the item is not yet expired.
  // Falsy values such as 0 or false are valid cached values.
  if (fromCache.value !== undefined) {
    return fromCache.value
  }

  const helper = new DataCacheHelper(getRequestTimestamp(event))

  try {
    const result = await cb(helper)

    // Marked as uncacheable in the callback: Not stored, but its cacheability
    // still bubbles, e.g. making the route uncacheable.
    if (helper.cacheable === false) {
      bubbleCacheability(helper, event, options?.bubbleCacheability)
      return result
    }

    await fromCache.addToCache(
      result,
      helper.tags,
      helper.maxAge,
      helper.staleIfError ?? undefined,
    )
    return result
  } catch (e) {
    if (fromCache.staleValue !== undefined) {
      bubbleCacheability(fromCache, event, options?.bubbleCacheability)
      return fromCache.staleValue
    }

    throw e
  }
}
