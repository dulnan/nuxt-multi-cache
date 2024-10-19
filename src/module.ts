import { fileURLToPath } from 'url'
import type { NuxtModule } from '@nuxt/schema'
import { defu } from 'defu'
import { relative } from 'pathe'
import {
  addServerHandler,
  createResolver,
  defineNuxtModule,
  addComponent,
  addImports,
  addTemplate,
  addServerPlugin,
  addServerImports,
} from '@nuxt/kit'
import type {
  MultiCacheServerOptions,
  NuxtMultiCacheOptions,
} from './runtime/types'
import {
  defaultOptions,
  DEFAULT_CDN_CONTROL_HEADER,
  DEFAULT_CDN_TAG_HEADER,
} from './runtime/settings'
import { logger, fileExists, nonNullable } from './utils'

// Nuxt needs this.
export type ModuleOptions = NuxtMultiCacheOptions
export type ModuleHooks = {}

/**
 * Log error message if obsolete configuration options are used.
 */
function checkObsoleteOptions(options: any) {
  const caches = ['component', 'data', 'route']
  caches.forEach((v) => {
    if (options[v] && options[v].storage) {
      logger.error(
        `The "storage" option on the cache configuration has been moved to the server options file.\n` +
          'Learn more: https://nuxt-multi-cache.dulnan.net/overview/server-options',
      )
    }
  })

  if (typeof options.api?.authorization === 'function') {
    logger.error(
      `The "api.authorization" option to use a custom callback has been moved to the server options file.\n` +
        'Learn more: https://nuxt-multi-cache.dulnan.net/overview/server-options',
    )
  }

  if (options.enabledForRequest) {
    logger.error(
      `The "enabledForRequest" option has been moved to the server options file.\n` +
        'Learn more: https://nuxt-multi-cache.dulnan.net/overview/server-options',
    )
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-multi-cache',
    configKey: 'multiCache',
    version: '3.3.3',
  },
  defaults: defaultOptions as any,
  async setup(passedOptions, nuxt) {
    const options = defu({}, passedOptions, {}) as ModuleOptions
    checkObsoleteOptions(options)
    const metaUrl = import.meta.url
    const { resolve } = createResolver(metaUrl)
    const rootDir = nuxt.options.rootDir
    const srcDir = nuxt.options.srcDir
    const srcResolver = createResolver(srcDir).resolve

    const runtimeDir = fileURLToPath(new URL('./runtime', metaUrl))
    nuxt.options.build.transpile.push(runtimeDir)
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
    if (options.data || nuxt.options._prepare) {
      addImports({
        from: resolve('./runtime/composables/useDataCache'),
        name: 'useDataCache',
      })
      addImports({
        from: resolve('./runtime/composables/useCachedAsyncData'),
        name: 'useCachedAsyncData',
      })
    }
    if (options.route || nuxt.options._prepare) {
      addImports({
        from: resolve('./runtime/composables/useRouteCache'),
        name: 'useRouteCache',
      })
    }
    if (options.cdn || nuxt.options._prepare) {
      addImports({
        from: resolve('./runtime/composables/useCDNHeaders'),
        name: 'useCDNHeaders',
      })
    }

    nuxt.options.alias['#nuxt-multi-cache/composables'] = resolve(
      'runtime/composables/index',
    )

    // Add RenderCacheable component if feature is enabled.
    if (options.component || nuxt.options._prepare) {
      await addComponent({
        filePath: resolve('./runtime/components/RenderCacheable/index'),
        name: 'RenderCacheable',
        global: true,
      })
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
      addServerPlugin(resolve('./runtime/server/plugins/multiCache'))
    }

    // Shamelessly copied and adapted from:
    // https://github.com/nuxt-modules/prismic/blob/fd90dc9acaa474f79b8831db5b8f46a9a9f039ca/src/module.ts#L55
    // Creates the template with runtime server configuration.
    const extensions = ['js', 'mjs', 'ts']

    const candidates: string[] = [
      '~/multiCache.serverOptions',
      '~/app/multiCache.serverOptions',
    ]
      .map((aliasPath) => {
        return aliasPath
          .replace(/^(~~|@@)/, nuxt.options.rootDir)
          .replace(/^(~|@)/, nuxt.options.srcDir)
      })
      .map((fullPath) => fileExists(fullPath))
      .filter(nonNullable)

    const resolvedPath = candidates[0] as string | undefined

    const moduleTypesPath = relative(
      nuxt.options.buildDir,
      resolve('./runtime/types.ts'),
    )

    const template = (() => {
      const maybeUserFile = resolvedPath && fileExists(resolvedPath, extensions)

      if (!maybeUserFile) {
        logger.warn('No multiCache.serverOptions file found.')
      }

      const serverOptionsLine = maybeUserFile
        ? `import serverOptions from '${relative(nuxt.options.buildDir, srcResolver(resolvedPath))}'`
        : `const serverOptions = {}`

      return addTemplate({
        filename: 'multiCache.serverOptions.mjs',
        write: true,
        getContents: () => `
${serverOptionsLine}
export { serverOptions }
`,
      })
    })()

    addTemplate({
      filename: 'multiCache.serverOptions.d.ts',
      write: true,
      getContents: () => {
        return `
import type { MultiCacheServerOptions } from '${moduleTypesPath}'
export const serverOptions: MultiCacheServerOptions
`
      },
    })

    nuxt.options.nitro.externals = nuxt.options.nitro.externals || {}
    nuxt.options.nitro.externals.inline =
      nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push(template.dst)
    nuxt.options.alias['#multi-cache-server-options'] = template.dst

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias['#multi-cache-server-options'] = template.dst
    })

    addServerImports([
      {
        from: resolve('./runtime/server/utils/useMultiCacheApp'),
        name: 'useMultiCacheApp',
      },
    ])

    // Add cache management API if enabled.
    if (options.api?.enabled) {
      // Prefix is defined in default config.
      const apiPrefix = options.api.prefix as string

      // The prefix for the internal cache management routes.
      const prefix = (path: string) => apiPrefix + '/' + path

      // Add the server API handlers for cache management.
      addServerHandler({
        handler: resolve('./runtime/server/api/purgeAll'),
        method: 'post',
        route: prefix('purge/all'),
      })
      addServerHandler({
        handler: resolve('./runtime/server/api/purgeTags'),
        method: 'post',
        route: prefix('purge/tags'),
      })
      addServerHandler({
        handler: resolve('./runtime/server/api/purgeItem'),
        method: 'post',
        route: prefix('purge/:cacheName'),
      })
      addServerHandler({
        handler: resolve('./runtime/server/api/stats'),
        method: 'get',
        route: prefix('stats/:cacheName'),
      })
      addServerHandler({
        handler: resolve('./runtime/server/api/inspectItem'),
        method: 'get',
        route: prefix('inspect/:cacheName'),
      })
    }
  },
}) as NuxtModule<ModuleOptions>

export function defineMultiCacheOptions(options: MultiCacheServerOptions) {
  const warning =
    'Importing "defineMultiCacheOptions" from "nuxt-multi-cache" is deprecated, as it increases server bundle size significantly. It should now be imported from "nuxt-multi-cache/dist/runtime/serverOptions" instead.'
  logger.error(['\n\n', warning, '\n\n'].join('!'.repeat(warning.length)))
  return options
}
