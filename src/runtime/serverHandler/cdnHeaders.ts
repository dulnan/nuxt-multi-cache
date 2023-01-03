import { defineEventHandler } from 'h3'
import { MULTI_CACHE_CDN_CONTEXT_KEY } from './../helpers/server'
import { NuxtMultiCacheCDNHelper } from './../helpers/CDNHelper'

/**
 * Add the CDN helper to the event context.
 */
export default defineEventHandler((event) => {
  const helper = new NuxtMultiCacheCDNHelper()

  // Add the instances to the H3 event context.
  event.context[MULTI_CACHE_CDN_CONTEXT_KEY] = helper
})
