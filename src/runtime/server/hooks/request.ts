import { type H3Event, getRequestURL } from 'h3'
import { enabledForRequest, getRequestTimestamp } from '../../helpers/server'
import { NuxtMultiCacheRouteCacheHelper } from '../../helpers/RouteCacheHelper'
import { useMultiCacheApp } from '../utils/useMultiCacheApp'
import { serverOptions } from '#nuxt-multi-cache/server-options'

/**
 * Method to check whether route caching is generally applicable to the given path.
 */
function applies(path: string): boolean {
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt_error')) {
    return false
  }

  if (serverOptions.route?.applies) {
    return serverOptions.route.applies(path)
  }

  // Exclude common files.
  return !/.\.(ico|png|jpg|js|css|html|woff|woff2|ttf|otf|eot|svg)$/.test(path)
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

  const app = useMultiCacheApp()
  event.context.multiCacheApp = app

  // Route cache is disabled.
  if (!app.cache.route) {
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
