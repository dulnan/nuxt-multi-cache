import { defu } from 'defu'
import { createUnplugin } from 'unplugin'
import { name, version } from '../package.json'
import { addBuildPlugin, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions } from './build/options'
import { defaultOptions } from './build/options/defaults'
import { ModuleHelper } from './build/ModuleHelper'
import { TEMPLATES } from './build/templates'
import { DEFAULT_CACHE_STATUS_NAME } from './runtime/helpers/constants'
import { pathToFileURL } from 'node:url'
import { parseURL } from 'ufo'

export type { CacheTagRegistry } from './runtime/types/CacheTagRegistry'
export type { CacheType, CDNCacheControl } from './runtime/types/index'
export type { ModuleOptions }

/**
 * Server-only modules imported by composables that are never called on the
 * client. In client builds they are replaced with these stubs, so that the
 * server code isn't bundled.
 */
const CLIENT_STUBS: Record<string, string> = {
  'runtime/shared/useDataCache':
    'export function useDataCacheImplementation() {}',
  'runtime/shared/useDataCacheCallback':
    'export function useDataCacheCallbackImplementation() {}',
  'runtime/shared/useCDNHeaders':
    'export function useCDNHeadersImplementation() {}',
  'runtime/server/utils/useRouteCache': 'export function useRouteCache() {}',
}

function getModulePath(id: string): string {
  return parseURL(decodeURIComponent(pathToFileURL(id).href)).pathname
}

function getClientStub(id: string): string | undefined {
  const path = getModulePath(id).replace(/\.[cm]?[jt]s$/, '')
  const key = Object.keys(CLIENT_STUBS).find((key) => path.endsWith(key))
  return key ? CLIENT_STUBS[key] : undefined
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'multiCache',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  setup(passedOptions, nuxt) {
    const options = defu({}, passedOptions, defaultOptions) as ModuleOptions
    const helper = new ModuleHelper(nuxt, import.meta.url, options)

    TEMPLATES.forEach((template) => {
      helper.addTemplate(template)
    })

    // Nitro resolves the preset when it's initialized, before the templates
    // are generated.
    nuxt.hook('nitro:init', (nitro) => {
      helper.setNitroPreset(nitro.options.preset)
    })

    helper.transpile(helper.resolvers.module.resolve('./runtime'))
    helper.inlineNitroExternals(helper.resolvers.module.resolve('./runtime'))
    helper.inlineNitroExternals(helper.paths.moduleBuildDir)

    nuxt.options.runtimeConfig.multiCache = {
      cdn: !!options.cdn?.enabled,
      component: !!options.component?.enabled,
      data: !!options.data?.enabled,
      route: !!options.route?.enabled,
      // Always a string, so that its generated type allows setting a name.
      routeCacheStatus:
        options.route?.cacheStatus === true
          ? DEFAULT_CACHE_STATUS_NAME
          : options.route?.cacheStatus || '',
      api: {
        enabled: !!options.api?.enabled,
        authorizationToken:
          typeof options.api?.authorization === 'string'
            ? options.api.authorization
            : '',
        authorizationDisabled: options.api?.authorization === false,
      },
    }

    // Add composables.
    if (options.data || nuxt.options._prepare) {
      helper.addComposable('useDataCache')
      helper.addComposable('useCachedAsyncData')
      helper.addComposable('useDataCacheCallback')
      helper.addServerUtil('useDataCache')
      helper.addServerUtil('useDataCacheCallback')
    }

    if (options.route || nuxt.options._prepare) {
      helper.addComposable('useRouteCache')
      helper.addServerUtil('useRouteCache')
    }

    if (options.cdn || nuxt.options._prepare) {
      helper.addComposable('useCDNHeaders')
      helper.addServerUtil('useCDNHeaders')
      helper.addPlugin('applyCDNHeaders', 'server')
    }

    // Add RenderCacheable component if feature is enabled.
    if (options.component || nuxt.options._prepare) {
      helper.addComponent('RenderCacheable', 'server')
      helper.addComponent('RenderCacheable', 'client')
      helper.addComposable('useComponentCache')
    }

    if (options.cdn || options.route || nuxt.options._prepare) {
      helper.addComposable('useCacheAwareFetchInterceptor')
    }

    // Add the server plugin if any of the features is enabled.
    // During local development these might all be disabled, so it's not
    // necessary to add the plugin.
    if (
      options.route?.enabled ||
      options.cdn?.enabled ||
      options.data?.enabled ||
      options.component?.enabled ||
      options.api?.enabled ||
      nuxt.options._prepare
    ) {
      helper.addServerPlugin('multiCache')
    }

    // Serve stale routes for errors that become the response. Nitro calls its
    // error handlers in order until one responds, so this one is put before
    // Nuxt's, which renders the error page. Added once Nitro is initialized,
    // so that no `nitro:config` hook can replace it.
    if (options.route) {
      const errorHandler = helper.resolvers.module.resolve(
        './runtime/server/handler/errorHandler',
      )
      nuxt.hook('nitro:init', (nitro) => {
        nitro.options.errorHandler = [
          errorHandler,
          ...[nitro.options.errorHandler ?? []].flat(),
        ]
      })
    }

    helper.addAlias('#nuxt-multi-cache', helper.paths.moduleBuildDir)
    helper.addServerUtil('useMultiCacheApp')

    // Add cache management API if enabled.
    if (options.api?.enabled) {
      helper.addServerHandler('purgeAll', 'purge/all', 'post')
      helper.addServerHandler('purgeTags', 'purge/tags', 'post')
      helper.addServerHandler('purgeItem', 'purge/:cacheName', 'post')
      helper.addServerHandler('stats', 'stats/:cacheName', 'get')
      helper.addServerHandler('inspectItem', 'inspect/:cacheName', 'get')
    }

    helper.applyBuildConfig()

    // These composables don't do anything on the client, so their calls (and
    // the callbacks passed to them) are removed from client bundles.
    nuxt.options.optimization.treeShake.composables.client[
      helper.resolvers.module.resolve('./runtime/composables')
    ] = ['useRouteCache', 'useCDNHeaders', 'useComponentCache']

    // Add a build plugin to make sure we don't ever include the server
    // options or other server-only code in a client build.
    addBuildPlugin(
      createUnplugin(() => {
        return {
          name: 'nuxt-multi-cache:server-only',
          enforce: 'pre',
          transformInclude(id) {
            const path = getModulePath(id)

            return (
              path.includes('runtime/helpers/multi-cache-logger') ||
              path.includes('server/multiCache.serverOptions') ||
              path.includes('nuxt-multi-cache/server-options') ||
              !!getClientStub(id)
            )
          },
          transform(_source, id) {
            // The code is replaced entirely, so there is nothing to map. An
            // empty source map tells the bundler so; without it, Rolldown
            // warns that the source map is likely to be incorrect.
            const replace = (code: string) => ({
              code,
              map: { mappings: '' } as const,
            })

            const stub = getClientStub(id)
            if (stub) {
              return replace(stub)
            } else if (id.includes('multiCache.serverOptions')) {
              // The userland file exporting `defineMultiCacheOptions`.
              return replace('export default function() { return {}; }')
            } else if (id.includes('multi-cache-logger')) {
              // We do this so that the consola package is not bundled in the
              // client, which for some reason happens even if it's supposed
              // to only be used on server bundles.
              return replace(`export const logger = console;`)
            }

            // The server-options template provided by the module.
            return replace(`export const serverOptions = {}`)
          },
        }
      }),
      {
        client: true,
        server: false,
      },
    )
  },
})
