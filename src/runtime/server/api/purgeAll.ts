import { defineEventHandler, createError } from 'h3'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import type { CachePurgeAllResponse, MultiCacheInstances } from './../../types'
import { checkAuth } from './helpers'

export default defineEventHandler<Promise<CachePurgeAllResponse>>(
  async (event) => {
    await checkAuth(event)

    const app = useMultiCacheApp()

    if (!app.cache) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get nuxt-multi-cache app.',
      })
    }

    let key: keyof MultiCacheInstances
    for (key in app.cache) {
      const cache = app.cache[key]
      if (cache) {
        await cache.storage.clear()
      }
    }

    return {
      status: 'OK',
    }
  },
)
