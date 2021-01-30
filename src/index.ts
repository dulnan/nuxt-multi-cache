import path from 'path'
import { Url } from 'url'
import { Context, Module } from '@nuxt/types'
import Cache from './Cache'
import serverMiddleware, { PurgeAuthCheckMethod } from './serverMiddleware'
import NuxtSSRCacheHelper from './ssrContextHelper'

const PLUGIN_PATH = path.resolve(__dirname, 'plugin.js')

export type EnabledForRequestMethod = (req: any, route: string) => boolean
export type GetCacheKeyMethod = (
  route: string,
  context: Context
) => string | void

export interface CacheConfig {
  enabled: boolean
  debug: boolean
  secret: string
  purgeAuthCheck: PurgeAuthCheckMethod
  enabledForRequest: EnabledForRequestMethod
  getCacheKey: GetCacheKeyMethod
}

/**
 * Determine the cache key for a route.
 */
function getCacheKey(route: string, context: any) {
  const url = context.req._parsedUrl as Url
  const pathname = url.pathname

  if (!pathname) {
    return
  }

  return route
}

function enabledForRequest() {
  return true
}

/*
 * Attaches a custom renderRoute method.
 *
 * It will store the SSR result in a local cache, if it is deemed cacheable.
 * Only anonymous requests (using the backend "API" user) will receive a cached
 * response.
 */
const cacheModule: Module = function () {
  const nuxt: any = this.nuxt
  const provided = this.options.routeCache || {}
  const config: CacheConfig = {
    enabled: !!provided.enabled,
    debug: !!provided.debug,
    secret: provided.secret,
    purgeAuthCheck: provided.purgeAuthCheck,
    enabledForRequest: provided.enabledForRequest || enabledForRequest,
    getCacheKey: provided.getCacheKey || getCacheKey,
  }

  function logger(message: string, type: string = 'info') {
    if (!config.debug) {
      return
    }
    const output = '[Nuxt Route Cache] - ' + message
    if (type === 'info') {
      console.info(output)
    } else if (type === 'warn') {
      console.warn(output)
    }
  }

  if (!config.enabled || !nuxt.renderer) {
    logger('Caching is disabled.')
    return
  }

  if (!config.secret && !provided.purgeAuthCheck) {
    logger(
      'No caching secret or auth check function provided, caching is disabled.',
      'warn'
    )
    return
  }

  if (!provided.enabledForRequest) {
    logger(
      'No custom enabledForRequest method provided. Caching is enabled for every request.'
    )
  }

  const cache = new Cache()

  // Add out server middleware to manage the cache.
  this.addServerMiddleware({
    path: '/__route_cache',
    handler: serverMiddleware(cache, config.secret, config.purgeAuthCheck),
  })

  // Add the cache helper plugin.
  this.addPlugin({
    src: PLUGIN_PATH,
  })

  // Inject the cache helper object into the SSR context.
  this.nuxt.hook('vue-renderer:ssr:prepareContext', (ssrContext: any) => {
    ssrContext.$cacheHelper = new NuxtSSRCacheHelper()
  })

  // Attach custom renderer.
  const renderer = nuxt.renderer
  const renderRoute = renderer.renderRoute.bind(renderer)

  renderer.renderRoute = function (route: string, context: any) {
    const cacheKey = getCacheKey(route, context)
    const cacheForRequest = config.enabledForRequest(context.req, route)

    if (!cacheKey || !cacheForRequest) {
      if (!cacheKey) {
        logger('No cache key returned for route: ' + route)
      }
      if (!cacheForRequest) {
        logger('Caching skipped for request.')
      }
      // Don't do any caching for this request.
      return renderRoute(route, context)
    }

    // Render the page and put it in the cache if cacheable.
    function renderSetCache() {
      return renderRoute(route, context).then((result: any) => {
        // Check if the route is set as cacheable.
        if (context.$cacheHelper && context.$cacheHelper.cacheable) {
          const tags = context.$cacheHelper.tags || []
          cache
            .set(cacheKey as string, tags, result)
            .then(() => {
              logger('Cached route: ' + route)
              logger('         key: ' + cacheKey)
            })
            .catch((e) => {
              logger('Failed to cache route: ' + route, 'warn')
            })
        }
        return result
      })
    }

    // Try to get the page from cache if it exists.
    return cache
      .get(cacheKey)
      .then(function (cachedResult) {
        if (cachedResult) {
          logger('HIT: ' + route)
          return cachedResult
        }
        logger('MISS: ' + route)
        return renderSetCache()
      })
      .catch(() => {
        logger('Failed to cache route: ' + route, 'warn')
        return renderRoute(route, context)
      })
  }
}

export default cacheModule
