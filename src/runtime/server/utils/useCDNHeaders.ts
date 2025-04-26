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
}
