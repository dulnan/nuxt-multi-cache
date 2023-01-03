import type { H3Event } from 'h3'
import { useSSRContext } from 'vue'
import type { NuxtMultiCacheCDNHelper } from './../helpers/CDNHelper'
import { getMultiCacheCDNHelper } from './../helpers/server'

/**
 * Return the helper to be used for interacting with the CDN headers feature.
 *
 * The helper is provided via a callback, which is only called server side.
 * That way the entire code patch, incl. calling useCDNHeaders, is removed
 * from client bundles.
 *
 * @param providedEvent Must be provided if not in a Vue context (page, component). This is the case when using this inside defineEventHandler.
 */
export function useCDNHeaders(
  cb: (helper: NuxtMultiCacheCDNHelper) => void,
  providedEvent?: H3Event,
): void {
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

  // Event couldn't be found for some reason.
  if (!event) {
    return
  }

  // Get CDN helper.
  const helper = getMultiCacheCDNHelper(event)
  if (!helper) {
    return
  }

  // Call callback with the helper.
  cb(helper)
}
