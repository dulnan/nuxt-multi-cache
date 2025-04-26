import type { H3Event } from 'h3'
import type { NuxtMultiCacheCDNHelper } from './../helpers/CDNHelper'
import { getMultiCacheCDNHelper } from './../helpers/server'
import { useRequestEvent } from '#imports'

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
  const isServer =
    import.meta.env.VITEST_SERVER === 'true' || import.meta.server

  if (!isServer) {
    return
  }

  const event = providedEvent || useRequestEvent()

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
