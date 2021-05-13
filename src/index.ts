import path from 'path'
import { Module } from '@nuxt/types'
import Filesystem, { CacheConfigFilesystem } from './Cache/Filesystem'
import serverMiddleware, { ServerAuthMethod, ServerAuthCredentials } from './ServerMiddleware'
import NuxtSSRCacheHelper from './ssrContextHelper'
import ComponentCache, { ComponentCacheConfig } from './Cache/Component'
import DataCache, { DataCacheConfig } from './Cache/Data'

const PLUGIN_PATH = path.resolve(__dirname, '/Plugin/')

export type EnabledForRequestMethod = (req: any, route: string) => boolean

export interface CacheConfig {

  /**
   * Enable the module globally.
   *
   * Even if disabled, the module will attach the helper plugin, but won't do
   * anything besides that.
   */
  enabled: boolean

  /**
   * Logs helpful debugging messages to the console.
   */
  debug?: boolean

  /**
   * Enable the filesystem cache.
   *
   * This will save every cached page to the specified location, preserving URL
   * structure and mapping them to folders and file names. Use this to serve
   * cached routes directly from Apache, nginx or any web server.
   */
  filesystem?: CacheConfigFilesystem|null|undefined

  /**
   * Enable the route cache.
   *
   * This will cache routes in memory in a LRU cache.
   */
  route?: any

  /**
   * Authenticate a server request.
   *
   * Provide an object with username and password properties to authenticate
   * using basic auth.
   * If you provide a function, you can perform the authentication yourself.
   * The function receives the request as an argument and should return a
   * boolean.
   */
  serverAuth: ServerAuthMethod|ServerAuthCredentials

  /**
   * A method to decide if a request should be considered for caching.
   *
   * The default method returns true for every route.
   * For example, you are able to completely prevent any caching if the user is
   * logged in, by checking for the presence of a cookie.
   */
  enabledForRequest: EnabledForRequestMethod

  /**
   * Configuration for the component cache.
   */
  componentCache?: ComponentCacheConfig

  /**
   * Configuration for the data cache.
   */
  dataCache?: DataCacheConfig
}

/**
 * Default method enables caching for every request.
 */
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

  // Map the configuration and add defaults.
  const config: CacheConfig = {
    enabled: !!provided.enabled,
    debug: !!provided.debug,
    filesystem: provided.filesystem,
    serverAuth: provided.serverAuth,
    enabledForRequest: provided.enabledForRequest || enabledForRequest,
    componentCache: provided.componentCache,
    dataCache: provided.dataCache,
  }

  if (config.filesystem?.folder) {
    const resolver = this.nuxt.resolver.resolveAlias
    config.filesystem.folder = resolver(config.filesystem.folder)
  }

  // Add the cache helper plugin.
  // There are different plugins for client and server. Only the server version
  // actually does anything, the client plugin is implemting all methods as no-op.
  this.addPlugin({
    src: PLUGIN_PATH + 'cache.server.js',
  })
  this.addPlugin({
    src: PLUGIN_PATH + 'cache.client.js',
  })

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

  // Disable caching if disabled or renderer not available.
  if (!config.enabled || !nuxt.renderer) {
    logger('Caching is disabled.')
    return
  }

  // Disable caching if no purge authorization if provided.
  if (typeof provided.serverAuth !== 'object' && typeof provided.serverAuth !== 'function') {
    logger(
      'No serverAuth function or basic auth config provided, caching is disabled.',
      'warn'
    )
    return
  }

  // Create global cache instances.
  let filesystemCache: Filesystem|null = null
  let componentCache: ComponentCache|null = null
  let dataCache: DataCache|null = null

  if (config.componentCache && config.componentCache.enabled && this.options.render.bundleRenderer) {
    componentCache = new ComponentCache(config.componentCache as ComponentCacheConfig)
    this.options.render.bundleRenderer.cache = componentCache
  }

  if (config.filesystem && config.filesystem.enabled) {
    filesystemCache = new Filesystem(config.filesystem)
  }

  if (config.dataCache && config.dataCache.enabled) {
    dataCache = new DataCache(config.dataCache)
  }

  // Add the server middleware to manage the cache.
  this.addServerMiddleware({
    path: '/__route_cache',
    handler: serverMiddleware(filesystemCache, dataCache, componentCache, config.serverAuth),
  })

  // Inject the cache helper object into the SSR context.
  this.nuxt.hook('vue-renderer:ssr:prepareContext', (ssrContext: any) => {
    ssrContext.$dataCache = dataCache
    ssrContext.$cacheHelper = new NuxtSSRCacheHelper()
  })

  // Attach custom renderer.
  const renderer = nuxt.renderer
  const renderRoute = renderer.renderRoute.bind(renderer)

  renderer.renderRoute = function (route: string, context: any) {
    if (!filesystemCache) {
      return renderRoute(route, context)
    }
    const cacheKey = filesystemCache?.getCacheKey(route, context)
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
    function renderWithCache() {
      return renderRoute(route, context).then((result: any) => {
        // Check if the route is set as cacheable.
        if (filesystemCache && context.$cacheHelper && context.$cacheHelper.cacheable) {
          // console.log(context.$cacheHelper.componentTags)
          const tags = context.$cacheHelper.tags || []
          const cacheGroups = context.$cacheHelper.cacheGroups || []
          cacheGroups.forEach((group: any) => filesystemCache?.addCacheGroup(group.name, group.tags))

          filesystemCache
            .set(cacheKey as string, tags, result.html)
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

    return renderWithCache().catch(() => {
      logger('Failed to cache route: ' + route, 'warn')
      return renderRoute(route, context)
    })
  }
}

export default cacheModule
