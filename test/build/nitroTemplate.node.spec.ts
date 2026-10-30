import { describe, expect, test } from 'vitest'
import nitroTemplate from '../../src/build/templates/definitions/nitro'
import type { ModuleHelper } from '../../src/build/ModuleHelper'

describe('The Nitro types template', () => {
  test('types the API responses', () => {
    const types = nitroTemplate.buildTypes!({
      options: {
        api: {
          prefix: '/__nuxt_multi_cache',
        },
      },
      paths: {
        runtimeTypes: 'runtime/types',
      },
    } as unknown as ModuleHelper)

    // Route and component cache items are returned as encoded strings.
    expect(types).toMatchInlineSnapshot(`
      "
      import type {
        CachePurgeItemResponse,
        CacheStatsResponse,
        CachePurgeAllResponse,
        CachePurgeTagsResponse,
        DataCacheItem
      } from 'runtime/types'

      declare module 'nitropack/types' {
        interface InternalApi {
          '/__nuxt_multi_cache/inspect/component': {
            'get': string
          }
          '/__nuxt_multi_cache/inspect/data': {
            'get': DataCacheItem
          }
          '/__nuxt_multi_cache/inspect/route': {
            'get': string
          }
          '/__nuxt_multi_cache/purge/all': {
            'post': CachePurgeAllResponse
          }
          '/__nuxt_multi_cache/purge/component': {
            'post': CachePurgeItemResponse
          }
          '/__nuxt_multi_cache/purge/data': {
            'post': CachePurgeItemResponse
          }
          '/__nuxt_multi_cache/purge/route': {
            'post': CachePurgeItemResponse
          }
          '/__nuxt_multi_cache/purge/tags': {
            'post': CachePurgeTagsResponse
          }
          '/__nuxt_multi_cache/stats/component': {
            'get': CacheStatsResponse<string>
          }
          '/__nuxt_multi_cache/stats/data': {
            'get': CacheStatsResponse<DataCacheItem>
          }
          '/__nuxt_multi_cache/stats/route': {
            'get': CacheStatsResponse<string>
          }
        }
      }"
    `)
  })
})
