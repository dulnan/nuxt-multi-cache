import type { H3Event } from 'h3'
import type { NuxtMultiCacheCDNHelper } from './../../helpers/CDNHelper'
import { getMultiCacheCDNHelper } from '../../helpers/server'

export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  event: H3Event,
): void {
  const helper = getMultiCacheCDNHelper(event)
  if (!helper) {
    return
  }

  cb(helper)

  // We have to set the headers already here because we could be in a cached
  // nitro event handler, where the event is being duplicated to run the
  // cached callback. In this case, no nitro request hooks are called.
  helper.applyToEvent(event)
}
