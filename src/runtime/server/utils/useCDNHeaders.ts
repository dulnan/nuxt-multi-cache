import type { H3Event } from 'h3'
import { NuxtMultiCacheCDNHelper } from './../../helpers/CDNHelper'
import {
  cdnCacheControlHeader,
  cdnCacheTagHeader,
  cdnEnabled,
} from '#nuxt-multi-cache/config'

export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  event: H3Event,
  applyToEvent?: boolean,
): void {
  if (!cdnEnabled) {
    return
  }

  let helper = event.context.multiCache?.cdn

  if (!helper) {
    helper = new NuxtMultiCacheCDNHelper(
      cdnCacheControlHeader,
      cdnCacheTagHeader,
    )
    event.context.multiCache ||= {}
    event.context.multiCache.cdn = helper
  }

  cb(helper)

  if (applyToEvent === false) {
    return
  }

  // We have to set the headers already here because we could be in a cached
  // nitro event handler, where the event is being duplicated to run the
  // cached callback. In this case, no nitro request hooks are called.
  helper.applyToEvent(event)
}
