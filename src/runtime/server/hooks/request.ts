import { type H3Event, getRequestURL } from 'h3'
import { enabledForRequest, getRequestTimestamp } from '../../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../helpers/RouteCacheHelper'
import {
  isExcludedRoutePath,
  isRouteCacheMethod,
} from '../../helpers/routeCache'
import { getMultiCacheApp } from '../utils/useMultiCacheApp'
import { serverOptions } from '#nuxt-multi-cache/server-options'
import { useRuntimeConfig } from '#imports'

/**
 * Method to check whether route caching is generally applicable to the given URL.
 */
function applies(url: URL): boolean {
  const path = url.pathname + url.search

  if (isExcludedRoutePath(path, useRuntimeConfig().app)) {
    return false
  }

  if (serverOptions.route?.applies) {
    return serverOptions.route.applies(path)
  }

  // Exclude common files. Only the pathname is checked, so that a query
  // string (e.g. "/style.css?v=2") doesn't prevent the exclusion.
  return !/.\.(ico|png|jpg|js|css|html|woff|woff2|ttf|otf|eot|svg)$/.test(
    url.pathname,
  )
}

/**
 * Callback for the 'request' nitro hook.
 *
 * This adds the context objects to the event and, if enabled, serves cached
 * routes.
 */
export async function onRequest(event: H3Event) {
  const url = getRequestURL(event)
  const path = url.pathname + url.search
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

  // Path is generally not cacheable, so we can skip it.
  if (!applies(url)) {
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
