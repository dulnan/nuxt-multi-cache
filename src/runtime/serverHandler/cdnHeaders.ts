import { defineEventHandler } from 'h3'
import { MULTI_CACHE_CDN_CONTEXT_KEY } from '../helpers/server'
import { NuxtMultiCacheCDNHelper } from '../helpers/CDNHelper'

/**
 * Add the "magic" CDN headers to the response.
 *
 * Both headers are actually objects that implement a custom toString method,
 * which is called right before the server response is sent.
 *
 * That way we can continue to modify the state of these objects for the
 * duration of the request.
 */
export default defineEventHandler((event) => {
  const helper = new NuxtMultiCacheCDNHelper()

  // Add the instances to the H3 event context.
  event.context[MULTI_CACHE_CDN_CONTEXT_KEY] = helper
})
