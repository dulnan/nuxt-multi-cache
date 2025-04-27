import type { H3Event } from 'h3'
import { NuxtMultiCacheCDNHelper } from './../../helpers/CDNHelper'
import { MULTI_CACHE_CDN_CONTEXT_KEY } from '../../helpers/server'
import {
  cdnCacheControlHeader,
  cdnCacheTagHeader,
  cdnEnabled,
} from '#nuxt-multi-cache/config'

export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  event: H3Event,
): void {
  if (!cdnEnabled) {
    return
  }

  let helper = event.context[MULTI_CACHE_CDN_CONTEXT_KEY]

  if (!helper) {
    helper = new NuxtMultiCacheCDNHelper(
      cdnCacheControlHeader,
      cdnCacheTagHeader,
    )
    event.context[MULTI_CACHE_CDN_CONTEXT_KEY] = helper
  }

  cb(helper)

  // We have to set the headers already here because we could be in a cached
  // nitro event handler, where the event is being duplicated to run the
  // cached callback. In this case, no nitro request hooks are called.
  helper.applyToEvent(event)
}
