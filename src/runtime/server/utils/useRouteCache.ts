import type { H3Event } from 'h3'
import { getMultiCacheRouteHelper } from '../../helpers/server'
import type { NuxtMultiCacheRouteCacheHelper } from './../../helpers/RouteCacheHelper'

export function useRouteCache(
  cb: (helper: NuxtMultiCacheRouteCacheHelper) => void,
  event: H3Event,
): void {
  const helper = getMultiCacheRouteHelper(event)

  if (!helper) {
    return
  }

  cb(helper)
}
