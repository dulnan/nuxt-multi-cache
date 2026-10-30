import type { H3Event } from 'h3'
import type { DataCacheHelper } from '../../helpers/DataCacheHelper'
import { useDataCacheCallbackImplementation } from '../../shared/useDataCacheCallback'
import type { UseDataCacheOptions } from '../../shared/useDataCache'

export type UseDataCacheCallbackCallback<T> = (
  helper?: DataCacheHelper,
) => Promise<T> | T

export async function useDataCacheCallback<T>(
  key: string,
  cb: UseDataCacheCallbackCallback<T>,
  event: H3Event,
  options?: UseDataCacheOptions,
): Promise<T> {
  return useDataCacheCallbackImplementation(key, cb, event, options)
}
