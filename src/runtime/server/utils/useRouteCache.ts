import type { H3Event } from 'h3'
import { getMultiCacheRouteHelper } from '../../helpers/server'
import type { NuxtMultiCacheRouteCacheHelper } from './../../helpers/RouteCacheHelper'
import { setInternalRouteCacheHeaders } from '../../helpers/routeCache'
import { CACHE_NEVER, CACHE_PERMANENT } from '../../helpers/maxAge'

export function useRouteCache(
  cb: (helper: NuxtMultiCacheRouteCacheHelper) => void,
  event: H3Event,
): void {
  const helper = getMultiCacheRouteHelper(event)

  if (!helper) {
    return
  }

  cb(helper)

  setInternalRouteCacheHeaders(event, {
    cacheTags: helper.tags,
    expires: helper.getExpires('maxAge') ?? CACHE_PERMANENT,
    staleIfErrorExpires: helper.getExpires('staleIfError') ?? CACHE_NEVER,
  })
}
