import type { H3Event } from 'h3'
import type { DataCacheCallbackContext } from '../../types'
import {
  useDataCacheImplementation,
  type UseDataCacheOptions,
} from '../../shared/useDataCache'

export async function useDataCache<T>(
  key: string,
  event: H3Event,
  options?: UseDataCacheOptions | null,
): Promise<DataCacheCallbackContext<T>> {
  return useDataCacheImplementation(key, event, options)
}
