import { defineEventHandler } from 'h3'
import type { CacheStatsResponse } from '../../types'
import { checkAuth, getCacheInstance } from './helpers'

export default defineEventHandler<Promise<CacheStatsResponse<unknown>>>(
  async (event) => {
    await checkAuth(event)
    const { storage } = getCacheInstance(event)
    const rows = await storage.getKeys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          return storage.getItem(key).then((data) => {
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
