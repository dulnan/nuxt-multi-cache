import { getMultiCacheContext } from '../../helpers/server'
import { NuxtMultiCacheSSRContext } from '../../../types'

export default defineEventHandler(async (event) => {
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
