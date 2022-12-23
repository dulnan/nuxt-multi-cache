import { fileURLToPath } from 'url'
import type { NuxtModule } from '@nuxt/schema'
import { defu } from 'defu'
import {
  addComponentsDir,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  addImportsDir,
} from '@nuxt/kit'
import type { NuxtMultiCacheOptions } from './types'
import { defaultOptions } from './runtime/settings'

// Nuxt needs this.
export type ModuleOptions = NuxtMultiCacheOptions
export type ModuleHooks = {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-multi-cache',
    configKey: 'multiCache',
    version: '1.0.0',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: defaultOptions,
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

    await addComponentsDir({
      path: resolve('./runtime/components'),
      pathPrefix: false,
      prefix: '',
      global: true,
    })

    // Add the event handler that attaches the SSR context object to the
    // request event.
    addServerHandler({
      handler: resolve('./runtime/serverHandler/cacheContext'),
    })

    const prefix = (path: string) => options.api!.prefix + '/' + path

    // Add the server API handlers for cache management.
    addServerHandler({
      handler: resolve('./runtime/serverHandler/api/purgeAll'),
      method: 'post',
      route: prefix('purge/all'),
    })
    addServerHandler({
      handler: resolve('./runtime/serverHandler/api/purgeTags'),
      method: 'post',
      route: prefix('purge/tags/:tag?'),
    })
    addServerHandler({
      handler: resolve('./runtime/serverHandler/api/purgeItem'),
      method: 'post',
      route: prefix('purge/:cacheName/:key?'),
    })
    addServerHandler({
      handler: resolve('./runtime/serverHandler/api/stats'),
      method: 'get',
      route: prefix('stats/:cacheName'),
    })
  },
}) as NuxtModule<ModuleOptions>
