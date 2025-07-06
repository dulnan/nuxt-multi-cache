import type { H3Event } from 'h3'
import { useDataCache } from './useDataCache'
import { DataCacheHelper } from '../../helpers/DataCacheHelper'

export type UseDataCacheCallbackCallback<T> = (
  helper?: DataCacheHelper,
) => Promise<T> | T

export async function useDataCacheCallback<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  event: H3Event,
): Promise<T> {
  const fromCache = await useDataCache<T>(key, event)

  // The "value" property contains a value if the item is not yet expired.
  if (fromCache.value) {
    return fromCache.value
  }

  const helper = new DataCacheHelper()

  try {
    const result = await cb(helper)
    await fromCache.addToCache(
      result,
      helper.tags,
      helper.maxAge,
      helper.staleIfError ?? undefined,
    )
    return result
  } catch (e) {
    if (fromCache.staleValue) {
      return fromCache.staleValue
    }

    throw e
  }
}
