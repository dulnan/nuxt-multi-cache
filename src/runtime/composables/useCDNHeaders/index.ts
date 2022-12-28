import type { H3Event } from 'h3'
import { useSSRContext } from 'vue'
import { getMultiCacheCDNHelper } from '../../helpers/server'
import type { NuxtMultiCacheCDNHelper } from '../../helpers/CDNHelper'

/**
 * Return the helper to be used for interacting with the CDN headers feature.
 *
 * @param providedEvent Must be provided if not in a Vue context (page, component). This is the case when using this inside defineEventHandler.
 */
export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  providedEvent?: H3Event,
): void {
  // Return dummy in client.
  if (process.client) {
    return
  }

  const event: H3Event = (() => {
    // Event provided by user.
    if (providedEvent) {
      return providedEvent
    }

    // SSR context should exist at this point, but TS doesn't know that.
    const ssrContext = useSSRContext()
    if (ssrContext) {
      return ssrContext.event
    }
  })()

  // Event couldn't be found for some reason, return dummy.
  if (!event) {
    return
  }

  const helper = getMultiCacheCDNHelper(event)
  if (!helper) {
    return
  }

  cb(helper)
}
