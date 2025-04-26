import { $fetch } from '@nuxt/test-utils/e2e'
import type {
  DataCacheItem,
  CacheStatsResponse,
} from './../../src/runtime/types'

export default function (): Promise<CacheStatsResponse<DataCacheItem>> {
  return $fetch(`/__nuxt_multi_cache/stats/data`, {
    method: 'get',
  })
}
