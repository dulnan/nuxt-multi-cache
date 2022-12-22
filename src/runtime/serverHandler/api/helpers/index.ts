import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { Storage } from 'unstorage'
import { NuxtMultiCacheSSRContext } from '~~/modules/componentCache/types'
import { getMultiCacheContext } from './../../../helpers/server'

export function getCacheInstance(event: H3Event): Storage {
  const cacheContext = getMultiCacheContext(event)
  if (!cacheContext) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load cache context.',
    })
  }
  const cacheName = event.context.params
    .cacheName as keyof NuxtMultiCacheSSRContext
  const cache = cacheContext[cacheName]
  if (!cache) {
    throw createError({
      statusCode: 404,
      statusMessage: `The given cache "${cacheName}" is not available.`,
    })
  }

  return cache
}
