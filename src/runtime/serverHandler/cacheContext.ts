import { defineEventHandler } from 'h3'
import type { H3Event } from 'h3'
import {
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
} from './../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from './../helpers/RouteCacheHelper'
import { loadCacheContext } from './helpers/storage'
import serverOptions from '#multi-cache-server-options'

/**
 * Add the cache context singleton to the current request.
 */
export function addCacheContext(event: H3Event) {
  // Init cache context if not already done.
  // Returns a single promise so that we don't initialize it multiple times
  // when multiple requests come in.
  const cacheContext = loadCacheContext()

  // Add the cache context object to the SSR context object.
  event.context[MULTI_CACHE_CONTEXT_KEY] = cacheContext

  // Add the route cache helper.
  event.context[MULTI_CACHE_ROUTE_CONTEXT_KEY] =
    new NuxtMultiCacheRouteCacheHelper()
}

export default defineEventHandler(async (event) => {
  if (!serverOptions.enabledForRequest) {
    return addCacheContext(event)
  }

  const shouldAdd = await serverOptions.enabledForRequest(event)
  if (shouldAdd) {
    addCacheContext(event)

    if (
      serverOptions.cacheKeyPrefix &&
      typeof serverOptions.cacheKeyPrefix !== 'string'
    ) {
      event.context[MULTI_CACHE_CONTEXT_KEY].cacheKeyPrefix =
        await serverOptions.cacheKeyPrefix(event)
    }
  }
})
