import { defineEventHandler } from 'h3'
import type { H3Event } from 'h3'
import { MULTI_CACHE_CONTEXT_KEY } from '../helpers/server'
import { getModuleConfig } from './helpers'
import { loadCacheContext } from './helpers/storage'

// Cache if the enabledForRequest method is provided.
let hasEnabledForRequestMethod: null | boolean = null

/**
 * Determine if the cache context should be added to the request.
 *
 * If the enabledForRequest method is provided, it is called with the H3 event.
 * If the method returns false, the cache context is not added.
 */
async function shouldAddCacheContext(event: H3Event): Promise<boolean> {
  if (hasEnabledForRequestMethod === false) {
    return true
  }

  const moduleConfig = await getModuleConfig()
  if (!moduleConfig.enabledForRequest) {
    hasEnabledForRequestMethod = false
    return true
  }

  return !!(await moduleConfig.enabledForRequest(event))
}

export default defineEventHandler(async (event) => {
  const shouldAdd = await shouldAddCacheContext(event)

  if (shouldAdd) {
    // Init cache context if not already done.
    // Returns a single promise so that we don't initialize it multiple times
    // when multiple requests come in.
    const cacheContext = await loadCacheContext()

    // Add the cache context object to the SSR context object.
    event.context[MULTI_CACHE_CONTEXT_KEY] = cacheContext
  }
})
