import { defineTemplate } from './../defineTemplate'

/**
 * Types for the generated endpoints.
 */
export default defineTemplate(
  { path: 'nuxt-multi-cache/nitro' },
  null,
  (helper) => {
    const serverApiPrefix = helper.options.api?.prefix
    const endpoints: string[] = []

    const caches = ['data', 'route', 'component']

    const add = (path: string, method: string, type: string) => {
      endpoints.push(
        `    '${serverApiPrefix}/${path}': {
      '${method}': ${type}
    }`,
      )
    }

    for (const cache of caches) {
      add('purge/' + cache, 'post', 'CachePurgeItemResponse')
    }

    // Route and component cache items are stored as encoded strings. They can
    // be decoded with decodeRouteCacheItem() and decodeComponentCacheItem().
    add('stats/data', 'get', 'CacheStatsResponse<DataCacheItem>')
    add('stats/route', 'get', 'CacheStatsResponse<string>')
    add('stats/component', 'get', 'CacheStatsResponse<string>')

    add('inspect/data', 'get', 'DataCacheItem')
    add('inspect/route', 'get', 'string')
    add('inspect/component', 'get', 'string')

    add('purge/all', 'post', 'CachePurgeAllResponse')
    add('purge/tags', 'post', 'CachePurgeTagsResponse')

    return `
import type {
  CachePurgeItemResponse,
  CacheStatsResponse,
  CachePurgeAllResponse,
  CachePurgeTagsResponse,
  DataCacheItem
} from '${helper.paths.runtimeTypes}'

declare module 'nitropack/types' {
  interface InternalApi {
${endpoints.sort().join('\n')}
  }
}`
  },
)
