import type { H3Event } from 'h3'
import {
  getMultiCacheRouteHelper,
  isInternalServerRequest,
} from '../../helpers/server'
import type { NuxtMultiCacheRouteCacheHelper } from './../../helpers/RouteCacheHelper'
import { setHeader } from 'h3'
import { ROUTE_CACHE_TAGS_HEADER } from '../../helpers/constants'

export function useRouteCache(
  cb: (helper: NuxtMultiCacheRouteCacheHelper) => void,
  event: H3Event,
): void {
  const helper = getMultiCacheRouteHelper(event)

  if (!helper) {
    return
  }

  cb(helper)

  if (isInternalServerRequest(event)) {
    setHeader(event, ROUTE_CACHE_TAGS_HEADER, helper.tags.join(' '))
  }
}
