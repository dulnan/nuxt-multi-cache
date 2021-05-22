import path from 'path'
import { Module } from '@nuxt/types'
import { PageCacheDisk, PageCacheMemory } from './Cache/Page'
import serverMiddleware  from './ServerMiddleware'
import NuxtSSRCacheHelper from './ssrContextHelper'
import ComponentCache from './Cache/Component'
import dummyComponentCache from './Cache/Component/dummyCache'
import DataCache  from './Cache/Data'
import GroupsCache from './Cache/Groups'
import { PageCacheMode } from './config'

const PLUGIN_PATH = path.resolve(__dirname, 'Plugin')

/**
 * Default method enables caching for every request.
 */
function defaultEnabledForRequest() {
  return true
}

/*
 * Install the module.
 */
const cacheModule: Module = function () {
  const nuxt: any = this.nuxt
  const provided = this.options.routeCache || {}

  // Map the configuration and add defaults.
  const enabled = !!provided.enabled
  const enabledForRequest = provided.enabledForRequest || defaultEnabledForRequest
  const debug = !!provided.debug
  const outputDirRaw = provided.outputDir
  const configServer = {
    auth: provided.server?.auth,
    path: provided.server?.path || '/__nuxt_multi_cache',
  }
  const configPageCache = {
    ...provided?.pageCache,
    mode: provided?.pageCache.mode || PageCacheMode.Memory
  }

  const configComponentCache = {
    ...provided?.componentCache
  }
  const configDataCache = {
    ...provided?.dataCache
  }
  const configGroupsCache= {
    ...provided?.groupsCache
  }

  if (!outputDirRaw) {
    throw new Error('Missing config outputDir.')
  }

  const resolver = this.nuxt.resolver.resolveAlias
  const outputDir = resolver(outputDirRaw)

  // Add the cache helper plugin.
  // There are different plugins for client and server. Only the server version
  // actually does anything, the client plugin is implemting all methods as no-op.
  this.addPlugin({
    src: path.resolve(PLUGIN_PATH, 'cache.server.js'),
  })
  this.addPlugin({
    src: path.resolve(PLUGIN_PATH, 'cache.client.js'),
  })

  function logger(message: string, type: string = 'info') {
    if (!debug) {
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
  if (!enabled || !nuxt.renderer) {
    logger('Caching is disabled.')
    return
  }

  // Disable caching if no purge authorization if provided.
  if (!provided.server || typeof provided.server.auth !== 'object' && typeof provided.server.auth !== 'function') {
    logger(
      'No serverAuth function or basic auth config provided, caching is disabled.',
      'warn'
    )
    return
  }

  // Create global cache instances.
  let pageCache: PageCacheDisk|PageCacheMemory|null = null
  let componentCache: ComponentCache|null = null
  let dataCache: DataCache|null = null
  let groupsCache: GroupsCache|null = null

  if (this.options.render.bundleRenderer) {
    if (configComponentCache && configComponentCache.enabled) {
      componentCache = new ComponentCache(configComponentCache)
      this.options.render.bundleRenderer.cache = componentCache as any
    } else {
      this.options.render.bundleRenderer.cache = dummyComponentCache as any
    }
  }

  if (configPageCache && configPageCache.enabled) {
    if (configPageCache.mode === PageCacheMode.Memory) {
      pageCache = new PageCacheMemory(configPageCache)
    } else if (configPageCache.mode === PageCacheMode.Static) {
      pageCache = new PageCacheDisk(configPageCache, outputDir)
    }
  }

  if (configDataCache && configDataCache.enabled) {
    dataCache = new DataCache(configDataCache)
  }

  if (configGroupsCache && configGroupsCache.enabled) {
    groupsCache = new GroupsCache(configGroupsCache, outputDir)
  }

  // Add the server middleware to manage the cache.
  this.addServerMiddleware({
    path: configServer.path,
    handler: serverMiddleware(pageCache, dataCache, componentCache, groupsCache, configServer.auth),
  })

  // Inject the cache helper object into the SSR context.
  this.nuxt.hook('vue-renderer:ssr:prepareContext', (ssrContext: any) => {
    ssrContext.$dataCache = dataCache
    ssrContext.$groupsCache = groupsCache
    ssrContext.$cacheHelper = new NuxtSSRCacheHelper()
  })

  // Attach custom renderer.
  const renderer = nuxt.renderer
  const renderRoute = renderer.renderRoute.bind(renderer)

  renderer.renderRoute = async function (route: string, context: any) {
    if (!pageCache) {
      return renderRoute(route, context)
    }
    const cacheKey = pageCache?.getCacheKey(route, context)
    const cacheForRequest = enabledForRequest(context.req, route)

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

    if (await pageCache.has(cacheKey)) {
      return await pageCache.get(cacheKey)
    }

    // Render the page and put it in the cache if cacheable.
    function renderWithCache() {
      return renderRoute(route, context).then((result: any) => {
        // Check if the route is set as cacheable.
        if (pageCache && context.$cacheHelper && context.$cacheHelper.cacheable) {
          const tags = context.$cacheHelper.tags || []

          pageCache
            .set(cacheKey as string, result, tags)
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
