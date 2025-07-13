import { defu } from 'defu'
import { createUnplugin } from 'unplugin'
import { name, version } from '../package.json'
import { addBuildPlugin, defineNuxtModule } from '@nuxt/kit'
import type { ModuleOptions } from './build/options'
import { defaultOptions } from './build/options/defaults'
import { ModuleHelper } from './build/ModuleHelper'
import { TEMPLATES } from './build/templates'

export type { ModuleOptions }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'multiCache',
    compatibility: {
      nuxt: '>=3.17.0',
    },
  },
  setup(passedOptions, nuxt) {
    const options = defu({}, passedOptions, defaultOptions) as ModuleOptions
    const helper = new ModuleHelper(nuxt, import.meta.url, options)

    TEMPLATES.forEach((template) => {
      helper.addTemplate(template)
    })

    helper.transpile(helper.resolvers.module.resolve('./runtime'))
    helper.inlineNitroExternals(helper.resolvers.module.resolve('./runtime'))
    helper.inlineNitroExternals(helper.paths.moduleBuildDir)

    nuxt.options.runtimeConfig.multiCache = {
      cdn: !!options.cdn?.enabled,
      component: !!options.component?.enabled,
      data: !!options.data?.enabled,
      route: !!options.route?.enabled,
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

    // Add a build plugin to make sure we don't ever include the server
    // options in a client build.
    addBuildPlugin(
      createUnplugin(() => {
        return {
          name: 'nuxt-multi-cache:server-only',
          enforce: 'pre',
          transformInclude(id) {
            return id.includes('nuxt-multi-cache/server-options')
          },
          transform() {
            return `export const serverOptions = {}`
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
