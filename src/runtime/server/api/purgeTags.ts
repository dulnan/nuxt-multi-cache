import type { H3Event } from 'h3'
import { readBody, defineEventHandler, createError } from 'h3'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import type { CachePurgeTagsResponse } from './../../types'
import { checkAuth } from './helpers'

/**
 * Get the tags to be purged from the request.
 *
 * Either a single tag can be provided via URL param or an array of tags via
 * request body.
 */
async function getTagsToPurge(event: H3Event): Promise<string[]> {
  const body = await readBody(event)
  if (body && Array.isArray(body)) {
    return body
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No valid tags provided.',
  })
}

/**
 * Purges all cache entries by tag.
 *
 * Currently this is highliy inefficient, since we have to load each cache
 * entry in order to figure out if it has to be invalidated.
 */
export default defineEventHandler<Promise<CachePurgeTagsResponse>>(
  async (event) => {
    await checkAuth(event)
    const tags = await getTagsToPurge(event)
    const app = useMultiCacheApp()

    app.cacheTagInvalidator.add(tags)

    return {
      status: 'OK',
      tags,
    }
  },
)
