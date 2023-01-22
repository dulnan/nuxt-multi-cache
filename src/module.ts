import { fileURLToPath } from 'url'
import { existsSync } from 'node:fs'
import type { NuxtModule } from '@nuxt/schema'
import { defu } from 'defu'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  addComponent,
  addImports,
  addTemplate,
} from '@nuxt/kit'
import { MutliCacheServerOptions, NuxtMultiCacheOptions } from './runtime/types'
import {
  defaultOptions,
  DEFAULT_CDN_CONTROL_HEADER,
  DEFAULT_CDN_TAG_HEADER,
} from './runtime/settings'

// Nuxt needs this.
export type ModuleOptions = NuxtMultiCacheOptions
export type ModuleHooks = {}

export const fileExists = (
  path?: string,
  extensions = ['js', 'ts'],
): string | null => {
  if (!path) {
    return null
  } else if (existsSync(path)) {
    // If path already contains/forces the extension
    return path
  }

  const extension = extensions.find((extension) =>
    existsSync(`${path}.${extension}`),
  )

  return extension ? `${path}.${extension}` : null
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-multi-cache',
    configKey: 'multiCache',
    version: '2.0.1',
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
      cdn: {
        cacheControlHeader:
          options.cdn?.cacheControlHeader || DEFAULT_CDN_CONTROL_HEADER,
        cacheTagHeader: options.cdn?.cacheTagHeader || DEFAULT_CDN_TAG_HEADER,
      },
      component: !!options.component?.enabled,
      data: !!options.data?.enabled,
      route: !!options.data?.enabled,
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

    // @TODO: Why is this needed?!
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.externals = defu(
        typeof nitroConfig.externals === 'object' ? nitroConfig.externals : {},
        {
          inline: [resolve('./runtime')],
        },
      )
    })

    // Add composables.
    if (options.data) {
      addImports({
        from: resolve('./runtime/composables/useDataCache'),
        name: 'useDataCache',
      })
    }
    if (options.route) {
      addImports({
        from: resolve('./runtime/composables/useRouteCache'),
        name: 'useRouteCache',
      })
    }
    if (options.cdn) {
      addImports({
        from: resolve('./runtime/composables/useCDNHeaders'),
        name: 'useCDNHeaders',
      })
    }

    nuxt.options.alias['#nuxt-multi-cache/composables'] = resolve(
      'runtime/composables/index',
    )

    // Add RenderCacheable component if feature is enabled.
    if (options.component) {
      await addComponent({
        filePath: resolve('./runtime/components/RenderCacheable/index'),
        name: 'RenderCacheable',
        global: true,
      })
    }

    if (options.component || options.route || options.data) {
      // Add the event handler that attaches the SSR context object to the
      // request event.
      addServerHandler({
        handler: resolve('./runtime/serverHandler/cacheContext'),
        middleware: true,
      })
    }

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

    // Hooks into sending the response and adds route to cache and adds CDN
    // headers.
    if (options.cdn?.enabled || options.route?.enabled) {
      addServerHandler({
        handler: resolve('./runtime/serverHandler/responseSend'),
      })
    }

    // Shamelessly copied and adapted from:
    // https://github.com/nuxt-modules/prismic/blob/fd90dc9acaa474f79b8831db5b8f46a9a9f039ca/src/module.ts#L55
    // Creates the template with runtime server configuration.
    const extensions = ['js', 'mjs', 'ts']
    const resolvedPath = '~/app/multiCache.serverOptions'
      .replace(/^(~~|@@)/, nuxt.options.rootDir)
      .replace(/^(~|@)/, nuxt.options.srcDir)

    const template = (() => {
      const resolvedFilename = `multiCache.serverOptions.ts`

      const maybeUserFile = fileExists(resolvedPath, extensions)

      if (maybeUserFile) {
        return addTemplate({
          filename: resolvedFilename,
          write: true,
          getContents: () => `export { default } from '${resolvedPath}'`,
        })
      }

      // Else provide `undefined` fallback
      return addTemplate({
        filename: resolvedFilename,
        write: true,
        getContents: () => 'export default {}',
      })
    })()

    nuxt.options.nitro.externals = nuxt.options.nitro.externals || {}
    nuxt.options.nitro.externals.inline =
      nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push(template.dst)
    nuxt.options.alias['#multi-cache-server-options'] = template.dst

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

export function defineMultiCacheOptions(options: MutliCacheServerOptions) {
  return options
}
