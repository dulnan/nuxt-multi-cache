import { defineEventHandler } from 'h3'
import { CacheControl } from '@tusbar/cache-control'
import { NuxtMultiCacheRouteContext } from '../types'
import {
  MULTI_CACHE_CONTEXT_KEY,
  MULTI_CACHE_ROUTE_CONTEXT_KEY,
} from '../helpers/server'
import { loadCacheContext } from './helpers/storage'

export default defineEventHandler(async (event) => {
  // Init cache context if not already done.
  // Returns a single promise so that we don't initialize it multiple times
  // when multiple requests come in.
  const cacheContext = await loadCacheContext()

  // Add the cache context object to the SSR context object.
  event.context[MULTI_CACHE_CONTEXT_KEY] = cacheContext

  // Create a route context this request.
  const routeContext: NuxtMultiCacheRouteContext = {
    tags: [],
    cacheable: null,
    control: new CacheControl(),
  }
  event.context[MULTI_CACHE_ROUTE_CONTEXT_KEY] = routeContext
})
