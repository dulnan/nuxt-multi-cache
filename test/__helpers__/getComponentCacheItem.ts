import { $fetch } from '@nuxt/test-utils/e2e'
import type {
  CacheStatsResponse,
  ComponentCacheItem,
} from './../../src/runtime/types'
import { decodeComponentCacheItem } from '~/src/runtime/helpers/cacheItem'

export default function (): Promise<
  { key: string; item: ComponentCacheItem }[]
> {
  return $fetch<CacheStatsResponse<string>>(
    `/__nuxt_multi_cache/stats/component`,
    {
      method: 'get',
    },
  ).then((response) => {
    return response.rows.map((item) => {
      return {
        key: item.key,
        item: decodeComponentCacheItem(item.data)!,
      }
    })
  })
}
