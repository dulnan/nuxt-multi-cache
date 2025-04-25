import { defineEventHandler } from 'h3'
import { checkAuth, getCacheInstance } from './helpers'
import type { CacheStatsResponse } from '../types'
import type { CacheItem } from '../../types'

export default defineEventHandler<Promise<CacheStatsResponse<unknown>>>(
  async (event) => {
    await checkAuth(event)
    const cache = getCacheInstance(event)
    const rows = await cache.getKeys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return cache.getItem(key).then((data) => {
            return { key, data: data as CacheItem }
          })
        }),
      )
    })

    return {
      status: 'OK',
      rows,
      total: rows.length,
    }
  },
)
