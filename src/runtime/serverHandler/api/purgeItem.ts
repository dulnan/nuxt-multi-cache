import type { H3Event } from 'h3'
import { readBody, getQuery } from 'h3'
import { checkAuth, getCacheInstance } from './helpers'

async function getKeysToPurge(event: H3Event): Promise<string[]> {
  const query = getQuery(event)
  if (query.key) {
    if (Array.isArray(query.key)) {
      return query.key as string[]
    }
    return [query.key]
  }

  const body = await readBody(event)
  if (body && Array.isArray(body)) {
    return body
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No valid keys provided.',
  })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const affectedKeys = await getKeysToPurge(event)
  const cache = getCacheInstance(event)
  affectedKeys.forEach((key) => cache.removeItem(key))

  return {
    status: 'OK',
    affectedKeys,
  }
})
