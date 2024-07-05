import { format } from '@tusbar/cache-control'
import { setResponseHeader, type H3Event } from 'h3'
import { getMultiCacheCDNHelper } from '../../helpers/server'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'

/**
 * Callback for the 'beforeResponse' nitro hook.
 *
 * This is called after a valid response was built, but before it is sent.
 */
export function onBeforeResponse(event: H3Event) {
  const cdnHelper = getMultiCacheCDNHelper(event)
  const multiCache = useMultiCacheApp()

  if (!cdnHelper) {
    return
  }

  const cacheTagsValue = cdnHelper._tags.join(' ')
  if (cacheTagsValue) {
    setResponseHeader(
      event,
      multiCache.config.cdn.cacheTagHeader,
      cacheTagsValue,
    )
  }

  const cacheControlValue = format(cdnHelper._control)
  if (cacheControlValue) {
    setResponseHeader(
      event,
      multiCache.config.cdn.cacheControlHeader,
      cacheControlValue,
    )
  }
}
