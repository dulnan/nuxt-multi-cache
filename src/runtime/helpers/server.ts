import type { H3Event } from 'h3'
import { NuxtMultiCacheRouteContext, NuxtMultiCacheSSRContext } from '../types'

export const MULTI_CACHE_CONTEXT_KEY = '__MULTI_CACHE'
export const MULTI_CACHE_ROUTE_CONTEXT_KEY = '__MULTI_CACHE_ROUTE'

export function getMultiCacheContext(
  event: H3Event,
): NuxtMultiCacheSSRContext | undefined {
  return event?.context?.[MULTI_CACHE_CONTEXT_KEY]
}

export function getMultiCacheRouteContext(
  event: H3Event,
): NuxtMultiCacheRouteContext {
  return event?.context?.[MULTI_CACHE_ROUTE_CONTEXT_KEY]
}
