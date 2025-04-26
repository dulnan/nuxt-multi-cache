import { defu } from 'defu'
import { defineNuxtModule } from '@nuxt/kit'
import {
  type ModuleOptions,
  defaultOptions,
  DEFAULT_CDN_CONTROL_HEADER,
  DEFAULT_CDN_TAG_HEADER,
} from './build/options'
import { ModuleHelper } from './build/ModuleHelper'
import { TEMPLATES } from './build/templates'

// Nuxt needs this.
export type { ModuleOptions }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-multi-cache',
    configKey: 'multiCache',
    version: '3.3.3',
    compatibility: {
      nuxt: '>=3.15.0',
    },
  },
  defaults: defaultOptions as any,
  setup(passedOptions, nuxt) {
    const helper = new ModuleHelper(nuxt, import.meta.url, passedOptions)

    TEMPLATES.forEach((template) => {
      helper.addTemplate(template)
    })

    const options = defu({}, passedOptions, {}) as ModuleOptions
    const rootDir = nuxt.options.rootDir

    helper.transpile(helper.resolvers.module.resolve('./runtime'))
    helper.inlineNitroExternals(helper.resolvers.module.resolve('./runtime'))
    helper.inlineNitroExternals(helper.paths.moduleBuildDir)

    nuxt.options.runtimeConfig.multiCache = {
      debug: !!options.debug,
      rootDir,
      cdn: {
        enabled: !!options.cdn?.enabled,
        cacheControlHeader:
          options.cdn?.cacheControlHeader || DEFAULT_CDN_CONTROL_HEADER,
        cacheTagHeader: options.cdn?.cacheTagHeader || DEFAULT_CDN_TAG_HEADER,
      },
      component: !!options.component?.enabled,
      data: !!options.data?.enabled,
      route: !!options.route?.enabled,
      api: {
        enabled: !!options.api?.enabled,
        prefix: options.api?.prefix || '',
        cacheTagInvalidationDelay: options.api
          ?.cacheTagInvalidationDelay as number,
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
      helper.addServerUtil('useDataCache')
    }

    if (options.route || nuxt.options._prepare) {
      helper.addComposable('useRouteCache')
      helper.addServerUtil('useRouteCache')
    }

    if (options.cdn || nuxt.options._prepare) {
      helper.addComposable('useCDNHeaders')
      helper.addServerUtil('useCDNHeaders')
    }

    // Add RenderCacheable component if feature is enabled.
    if (options.component || nuxt.options._prepare) {
      helper.addComponent('RenderCacheable')
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
  },
})
