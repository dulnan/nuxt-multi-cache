import type { H3Event } from 'h3'
import type { NuxtMultiCacheCDNHelper } from './../../helpers/CDNHelper'
import { useCDNHeadersImplementation } from '../../shared/useCDNHeaders'

export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  event: H3Event,
  applyToEvent?: boolean,
): void {
  return useCDNHeadersImplementation(cb, event, applyToEvent)
}
