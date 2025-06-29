import { defineEventHandler } from 'h3'
import type { CacheStatsResponse } from '../../types'
import { checkAuth, getCacheInstance } from './helpers'

export default defineEventHandler<Promise<CacheStatsResponse<unknown>>>(
  async (event) => {
    await checkAuth(event)
    const cache = getCacheInstance(event)
    const rows = await cache.getKeys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return cache.getItem(key).then((data) => {
            return { key, data: data }
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
