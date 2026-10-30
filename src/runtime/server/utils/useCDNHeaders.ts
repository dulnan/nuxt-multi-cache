import type { H3Event } from 'h3'
import type { NuxtMultiCacheCDNHelper } from './../../helpers/CDNHelper'
import { useCDNHeadersImplementation } from '../../shared/useCDNHeaders'

/**
 * Return the helper to be used for interacting with the CDN headers feature.
 *
 * @param cb - The callback. Receives the CDN Helper as the first argument.
 * @param event - The request event.
 * @param applyToEvent - Whether to apply the headers to the response right away. Defaults to true. If false, the values are only collected and applied by a later call.
 */
export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  event: H3Event,
  applyToEvent?: boolean,
): void {
  return useCDNHeadersImplementation(cb, event, applyToEvent)
}
