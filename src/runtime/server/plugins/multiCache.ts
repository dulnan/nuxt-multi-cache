import { defineNitroPlugin } from 'nitropack/runtime'
import { createStorage } from 'unstorage'
import { onRequest } from '../hooks/request'
import { onAfterResponse } from '../hooks/afterResponse'
import type {
  MultiCacheApp,
  MultiCacheServerOptionsCacheOptions,
  MultiCacheInstances,
  MultiCacheInstance,
} from '../../types'
import { onRenderResponse } from '../hooks/renderResponse'
import { onBeforeResponse } from '../hooks/beforeResponse'
import { onBeforeResponseCacheStatus } from '../hooks/cacheStatus'
import { getCacheStatusName } from '../../helpers/cacheStatus'
import { MultiCacheState } from '../../helpers/MultiCacheState'
import { serveCachedHandler } from '../handler/serveCachedRoute'
import { serverOptions } from '#nuxt-multi-cache/server-options'
import {
  shouldLogCacheOverview,
  isTestMode,
  cdnEnabled,
  cdnPrivateCacheControl,
  componentCacheEnabled,
  dataCacheEnabled,
  routeCacheEnabled,
  apiEnabled,
} from '#nuxt-multi-cache/config'
import { useRuntimeConfig } from '#imports'
import { InMemoryCacheTagRegistry } from '../../helpers/InMemoryCacheTagRegistry'
import { CacheTagInvalidator } from '../../helpers/CacheTagInvalidator'
import { logger } from '../../helpers/multi-cache-logger'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '../../helpers/constants'

function createCacheContext(
  cache: MultiCacheServerOptionsCacheOptions | undefined,
  defaults: Required<Omit<MultiCacheServerOptionsCacheOptions, 'storage'>>,
): MultiCacheInstance {
  return {
    storage: createStorage(cache?.storage),
    bubbleError: cache?.bubbleError ?? defaults.bubbleError,
  }
}

function createMultiCacheApp(): MultiCacheApp {
  const runtimeConfig = useRuntimeConfig()

  const cacheContext: MultiCacheInstances = {}

  // Initialize all enabled caches. Explicit initialization because some
  // caches might need additional configuration options and/or checks.
  if (runtimeConfig.multiCache.component && componentCacheEnabled) {
    cacheContext.component = createCacheContext(serverOptions.component, {
      bubbleError: false,
    })
  }

  if (runtimeConfig.multiCache.data && dataCacheEnabled) {
    cacheContext.data = createCacheContext(serverOptions.data, {
      bubbleError: true,
    })
  }

  if (runtimeConfig.multiCache.route && routeCacheEnabled) {
    cacheContext.route = createCacheContext(serverOptions.route, {
      bubbleError: false,
    })
  }

  const cacheTagRegistry =
    serverOptions.cacheTagRegistry === 'in-memory'
      ? new InMemoryCacheTagRegistry()
      : (serverOptions.cacheTagRegistry ?? null)

  const cacheTagInvalidator = new CacheTagInvalidator(
    cacheContext,
    cacheTagRegistry,
  )

  let internalRequestToken: string | undefined

  return {
    cache: cacheContext,
    serverOptions,
    config: runtimeConfig.multiCache,
    state: new MultiCacheState(),
    cacheTagRegistry,
    cacheTagInvalidator,
    // Internal requests are handled in the same process, so the token never
    // has to be known outside of it. It's generated on first use, during a
    // request: Cloudflare Workers don't allow generating random values in the
    // global scope, where Nitro plugins run.
    get internalRequestToken() {
      internalRequestToken ??= crypto.randomUUID()
      return internalRequestToken
    },
  }
}

export default defineNitroPlugin((nitroApp) => {
  const multiCache = createMultiCacheApp()
  nitroApp.multiCache = multiCache

  // Test mode is a build option, because e2e tests run against production
  // builds. Make sure such a build is noticed if it's deployed.
  if (isTestMode) {
    logger.warn(
      `Test mode is enabled: Any request can override the current time of the caches with the "${TEST_MODE_DATE_OVERRIDE_HEADER}" header. Never deploy this build.`,
    )
  }

  // Adds the context and, if the route cache applies, the route cache helper
  // to the event.
  nitroApp.hooks.hook('request', onRequest)

  // Only needed if route caching is enabled.
  if (multiCache.config.route) {
    // Add the handler that may serve cached routes.
    // We have to make sure that this handler is the very first in the array.
    // Using "unshift" is our only option here, but there is no guarantee that
    // during runtime our handler is actually executed first.
    nitroApp.h3App.stack.unshift({
      route: '/',
      handler: serveCachedHandler,
    })

    // Hook into afterResponse to store cacheable responses in cache.
    nitroApp.hooks.hook('afterResponse', onAfterResponse)

    // Serve stale routes instead of Nuxt's inline error page. Other errors
    // that become the response are handled by the module's Nitro error
    // handler.
    nitroApp.hooks.hook('render:response', onRenderResponse)

    // Add the Cache-Status header to responses.
    if (getCacheStatusName(multiCache.config.routeCacheStatus)) {
      nitroApp.hooks.hook('beforeResponse', onBeforeResponseCacheStatus)
    }
  }

  // Mark responses that are private for the CDN as private in Cache-Control.
  if (multiCache.config.cdn && cdnEnabled && cdnPrivateCacheControl) {
    nitroApp.hooks.hook('beforeResponse', onBeforeResponse)
  }

  if (shouldLogCacheOverview) {
    const runtimeConfig = useRuntimeConfig()
    const debugTableEntry = (
      name: string,
      atBuild?: boolean,
      runtime?: boolean,
    ) => {
      console.log(
        `| ${name.padEnd(18)} | ${(atBuild ? '✅' : '❌').padEnd(15)} | ${(atBuild && runtime ? '✅' : '❌').padEnd(17)} |`,
      )
    }
    console.log('\n\nnuxt-multi-cache configuration')
    console.log('-'.repeat(62))
    console.log(
      `| Feature            | Added in Build   | Enabled at Runtime |`,
    )
    console.log('-'.repeat(62))
    debugTableEntry(
      'Component Cache',
      componentCacheEnabled,
      runtimeConfig.multiCache.component,
    )
    debugTableEntry(
      'Data Cache',
      dataCacheEnabled,
      runtimeConfig.multiCache.data,
    )
    debugTableEntry(
      'Route Cache',
      routeCacheEnabled,
      runtimeConfig.multiCache.route,
    )
    debugTableEntry('CDN Headers', cdnEnabled, runtimeConfig.multiCache.cdn)
    debugTableEntry('API', apiEnabled, runtimeConfig.multiCache.api?.enabled)
    console.log('-'.repeat(62))
    console.log(
      'A feature is added when its key exists in the module options, also with "enabled: false". Remove the key to leave it out of the build.',
    )
    console.log(
      `You can disable this message by setting "disableCacheOverviewLogMessage: true" in the module's configuration.\n`,
    )
  }
})
