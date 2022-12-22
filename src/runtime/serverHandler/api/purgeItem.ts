import { getCacheInstance } from './helpers'
import type { H3Event } from 'h3'
import { readBody } from 'h3'

async function getKeysToPurge(event: H3Event): Promise<string[]> {
  const key = event.context.params.key
  if (key) {
    return [key]
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
  const affectedKeys = await getKeysToPurge(event)
  const cache = getCacheInstance(event)
  affectedKeys.forEach((key) => cache.removeItem(key))

  return {
    status: 'OK',
    affectedKeys,
  }
})
