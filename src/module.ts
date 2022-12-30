import { fileURLToPath } from 'url'
import type { NuxtModule } from '@nuxt/schema'
import { defu } from 'defu'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  addImportsDir,
  addComponent,
} from '@nuxt/kit'
import type { NuxtMultiCacheOptions } from './runtime/types'
import { defaultOptions } from './runtime/settings'

// Nuxt needs this.
export type ModuleOptions = NuxtMultiCacheOptions
export type ModuleHooks = {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-multi-cache',
    configKey: 'multiCache',
    version: '2.0.0',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: defaultOptions as any,
  async setup(passedOptions, nuxt) {
    const options = defu({}, passedOptions, {}) as ModuleOptions
    const { resolve } = createResolver(import.meta.url)
    const rootDir = nuxt.options.rootDir

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.runtimeConfig.multiCache = {
      rootDir,
    }

    // Add composables.
    addImportsDir(resolve('./runtime/composables'))
    nuxt.options.alias['#nuxt-multi-cache'] = resolve('runtime/composables')

    // Add RenderCacheable component if feature is enabled.
    if (options.component) {
      await addComponent({
        filePath: resolve('./runtime/components/RenderCacheable/index.ts'),
        name: 'RenderCacheable',
        global: true,
      })
    }

    // Add the event handler that attaches the SSR context object to the
    // request event.
    addServerHandler({
      handler: resolve('./runtime/serverHandler/cacheContext'),
      middleware: true,
    })

    // Adds the CDN helper to the event context.
    if (options.cdn?.enabled) {
      addServerHandler({
        handler: resolve('./runtime/serverHandler/cdnHeaders'),
        middleware: true,
      })
    }

    // Serves cached routes.
    if (options.route?.enabled) {
      addServerHandler({
        handler: resolve('./runtime/serverHandler/serveCachedRoute'),
      })
    }

    // Hooks into sending the response.
    if (options.cdn?.enabled || options.route?.enabled) {
      addServerHandler({
        handler: resolve('./runtime/serverHandler/responseSend'),
      })
    }

    // Add cache management API if enabled.
    if (options.api?.enabled) {
      // Prefix is defined in default config.
      const apiPrefix = options.api.prefix as string

      // The prefix for the internal cache management routes.
      const prefix = (path: string) => apiPrefix + '/' + path

      // Add the server API handlers for cache management.
      addServerHandler({
        handler: resolve('./runtime/serverHandler/api/purgeAll'),
        method: 'post',
        route: prefix('purge/all'),
      })
      addServerHandler({
        handler: resolve('./runtime/serverHandler/api/purgeTags'),
        method: 'post',
        route: prefix('purge/tags'),
      })
      addServerHandler({
        handler: resolve('./runtime/serverHandler/api/purgeItem'),
        method: 'post',
        route: prefix('purge/:cacheName'),
      })
      addServerHandler({
        handler: resolve('./runtime/serverHandler/api/stats'),
        method: 'get',
        route: prefix('stats/:cacheName'),
      })
      addServerHandler({
        handler: resolve('./runtime/serverHandler/api/inspectItem'),
        method: 'get',
        route: prefix('inspect/:cacheName'),
      })
    }
  },
}) as NuxtModule<ModuleOptions>
