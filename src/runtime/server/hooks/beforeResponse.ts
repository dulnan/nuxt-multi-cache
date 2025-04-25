import { format } from '@tusbar/cache-control'
import { setResponseHeader, type H3Event } from 'h3'
import { getMultiCacheCDNHelper, onlyUnique } from '../../helpers/server'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import type { MultiCacheApp } from '../../types'

function handleCDN(app: MultiCacheApp, event: H3Event) {
  const cdnHelper = getMultiCacheCDNHelper(event)
  if (!cdnHelper) {
    return
  }

  const cacheTagsValue = cdnHelper._tags.filter(onlyUnique).join(' ')
  if (cacheTagsValue) {
    setResponseHeader(event, app.config.cdn.cacheTagHeader, cacheTagsValue)
  }

  const cacheControlValue = format(cdnHelper._control)
  if (cacheControlValue) {
    setResponseHeader(
      event,
      app.config.cdn.cacheControlHeader,
      cacheControlValue,
    )
  }
}

/**
 * Callback for the 'beforeResponse' nitro hook.
 *
 * This is called after a valid response was built, but before it is sent.
 */
export function onBeforeResponse(
  event: H3Event,
  _response: { body?: unknown },
) {
  const app = useMultiCacheApp()

  handleCDN(app, event)
}
