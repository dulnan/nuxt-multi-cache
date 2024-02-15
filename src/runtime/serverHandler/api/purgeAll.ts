import { defineEventHandler } from 'h3'
import { getMultiCacheContext } from './../../helpers/server'
import type { NuxtMultiCacheSSRContext } from './../../types'
import { checkAuth } from './helpers'

export default defineEventHandler(async (event) => {
  await checkAuth(event)

  const cacheContext = getMultiCacheContext(event)
  if (!cacheContext) {
    return
  }

  let key: keyof NuxtMultiCacheSSRContext
  for (key in cacheContext) {
    const cache = cacheContext[key]
    if (cache) {
      await cache.clear()
    }
  }

  return {
    status: 'OK',
  }
})
