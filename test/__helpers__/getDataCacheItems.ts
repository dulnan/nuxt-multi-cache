import { $fetch } from '@nuxt/test-utils/e2e'
import type { CacheStatsResponse } from './../../src/runtime/server/types'
import type { DataCacheItem } from './../../src/runtime/types'

export default function (): Promise<CacheStatsResponse<DataCacheItem>> {
  return $fetch(`/__nuxt_multi_cache/stats/data`, {
    method: 'get',
  })
}
