import { defineEventHandler } from 'h3'
import type { NuxtMultiCacheSSRContext } from './../../types'
import { checkAuth } from './helpers'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'

export default defineEventHandler(async (event) => {
  await checkAuth(event)

  const app = useMultiCacheApp()

  if (!app.cache) {
    return
  }

  let key: keyof NuxtMultiCacheSSRContext
  for (key in app.cache) {
    const cache = app.cache[key]
    if (cache) {
      await cache.clear()
    }
  }

  return {
    status: 'OK',
  }
})
