import type { H3Event } from 'h3'
import type { NuxtMultiCacheCDNHelper } from './../helpers/CDNHelper'
import { useCDNHeaders as serverUseCdnHeaders } from './../server/utils/useCDNHeaders'
import { useRequestEvent } from '#imports'
import { isServer } from '#nuxt-multi-cache/config'

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
  if (!isServer) {
    return
  }

  const event = providedEvent || useRequestEvent()

  if (!event) {
    return
  }

  serverUseCdnHeaders(cb, event)
}
