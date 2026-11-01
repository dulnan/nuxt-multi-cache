import type { H3Event } from 'h3'
import {
  addCacheStatusHeader,
  getCacheStatusName,
  getCacheStatusTtl,
} from '../../helpers/cacheStatus'
import { getRequestTimestamp } from '../../helpers/server'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import { getStorableRoute } from './afterResponse'

/**
 * Callback for the 'beforeResponse' nitro hook, if the Cache-Status header is
 * enabled.
 *
 * Adds the entry of the route cache to the Cache-Status header. This happens
 * once the response is complete, so that a response rendered by the app can
 * be marked as stored.
 *
 * Error responses are sent without this hook: The module's error handler adds
 * the entry to them.
 */
export function onBeforeResponseCacheStatus(
  event: H3Event,
  response: { body?: unknown } | undefined,
) {
  const status = event.context.multiCache?.routeCacheStatus
  const name = getCacheStatusName(getMultiCacheApp().config.routeCacheStatus)
  if (!status || !name) {
    return
  }

  // The response to a request that was looked up but not served from the
  // route cache may be stored.
  if (
    status.fwd === 'uri-miss' ||
    status.fwd === 'miss' ||
    status.fwd === 'stale'
  ) {
    const storable = getStorableRoute(event, response)
    if (storable) {
      return addCacheStatusHeader(event, name, {
        ...status,
        ttl: getCacheStatusTtl(storable.expires, getRequestTimestamp(event)),
        stored: true,
      })
    }
  }

  addCacheStatusHeader(event, name, status)
}
