import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { checkAuth, getCacheInstance } from './helpers'
import type { CachePurgeItemResponse } from '../../types'

async function getKeysToPurge(event: H3Event): Promise<string[]> {
  const body = await readBody(event)
  if (body && Array.isArray(body)) {
    return body
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No valid keys provided.',
  })
}

export default defineEventHandler<Promise<CachePurgeItemResponse>>(
  async (event) => {
    await checkAuth(event)
    const affectedKeys = await getKeysToPurge(event)
    const { storage, name } = getCacheInstance(event)
    const app = useMultiCacheApp()
    for (const key of affectedKeys) {
      await storage.removeItem(key)
      if (app.cacheTagRegistry) {
        await app.cacheTagRegistry.removeCacheItem(name, key)
      }
    }

    return {
      status: 'OK',
      affectedKeys,
    }
  },
)
