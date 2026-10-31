import type { H3Event } from 'h3'
import { enabledForRequest, getRequestTimestamp } from '../../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../helpers/RouteCacheHelper'
import {
  isAmbiguousRoutePath,
  isExcludedRoutePath,
  isRouteCacheMethod,
} from '../../helpers/routeCache'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import { serverOptions } from '#nuxt-multi-cache/server-options'
import { useRuntimeConfig } from '#imports'

/**
 * Method to check whether route caching is generally applicable to the given
 * path.
 *
 * @param path - The decoded request path, including the query string.
 */
function applies(path: string): boolean {
  if (isExcludedRoutePath(path, useRuntimeConfig().app)) {
    return false
  }

  if (serverOptions.route?.applies) {
    return serverOptions.route.applies(path)
  }

  // Exclude common files. Only the pathname is checked, so that a query
  // string (e.g. "/style.css?v=2") doesn't prevent the exclusion.
  return !/.\.(ico|png|jpg|js|css|html|woff|woff2|ttf|otf|eot|svg)$/.test(
    path.split('?')[0]!,
  )
}

/**
 * Callback for the 'request' nitro hook.
 *
 * This adds the context objects to the event and, if the route cache applies
 * to the request, the route cache helper. Cached routes are only served and
 * stored for requests with the route cache helper.
 */
export async function onRequest(event: H3Event) {
  // At this point, h3 has decoded the path, but hasn't removed the base URL:
  // The path that the router and the Nuxt renderer use. Checking the raw URL
  // instead would let "/%63heckout" (rendered as "/checkout") pass a check
  // for "/checkout".
  const path = event.path
  if (!path) {
    return
  }

  const app = getMultiCacheApp()
  event.context.multiCacheApp = app

  // Route cache is disabled.
  if (!app.cache.route) {
    return
  }

  // Responses to other methods (e.g. POST) are never stored.
  if (!isRouteCacheMethod(event)) {
    return
  }

  // The cache key would belong to a different path than the one that is
  // rendered, e.g. for "//contact".
  if (isAmbiguousRoutePath(path)) {
    return
  }

  // Path is generally not cacheable, so we can skip it.
  if (!applies(path)) {
    return
  }

  const isEnabled = await enabledForRequest(event)

  if (!isEnabled) {
    return
  }

  // Add the route cache helper.
  event.context.multiCache ||= {}
  event.context.multiCache.route = new NuxtMultiCacheRouteCacheHelper(
    getRequestTimestamp(event),
  )
}
