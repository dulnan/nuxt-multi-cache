import { $fetch } from '@nuxt/test-utils/e2e'
import { decodeRouteCacheItem } from '~/src/runtime/helpers/cacheItem'
import type { CacheStatsResponse, RouteCacheItem } from '~/src/runtime/types'

export default function (): Promise<{ key: string; item: RouteCacheItem }[]> {
  return $fetch<CacheStatsResponse<string>>(`/__nuxt_multi_cache/stats/route`, {
    method: 'get',
  }).then((response) => {
    return response.rows.map((row) => {
      return {
        key: row.key,
        item: decodeRouteCacheItem(row.data)!,
      }
    })
  })
}
