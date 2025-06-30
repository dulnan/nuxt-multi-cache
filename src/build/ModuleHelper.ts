import {
  addImports,
  addPlugin,
  addServerHandler,
  addServerImports,
  createResolver,
  addTemplate,
  addTypeTemplate,
  addComponent,
  addServerPlugin,
  type Resolver,
} from '@nuxt/kit'
import { relative } from 'pathe'
import type { RouterMethod } from 'h3'
import type { Nuxt, ResolvedNuxtTemplate } from 'nuxt/schema'
import type { ModuleOptions } from './options'
import type { defaultOptions } from './options/defaults'
import { logger } from './logger'
import { fileExists } from './helpers'
import type { ModuleTemplate } from './templates/defineTemplate'

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * Log error message if obsolete configuration options are used.
 */
function checkObsoleteOptions(options: any) {
  const caches = ['component', 'data', 'route']
  caches.forEach((v) => {
    if (options[v] && options[v].storage) {
      throw new Error(
        `The "storage" option on the cache configuration has been moved to the server options file.\n` +
          'Learn more: https://nuxt-multi-cache.dulnan.net/overview/server-options',
      )
    }
  })

  if (typeof options.api?.authorization === 'function') {
    throw new TypeError(
      `The "api.authorization" option to use a custom callback has been moved to the server options file.\n` +
        'Learn more: https://nuxt-multi-cache.dulnan.net/overview/server-options',
    )
  }

  if (options.enabledForRequest) {
    throw new Error(
      `The "enabledForRequest" option has been moved to the server options file.\n` +
        'Learn more: https://nuxt-multi-cache.dulnan.net/overview/server-options',
    )
  }
}

type RequiredModuleOptions = WithRequired<
  ModuleOptions,
  keyof typeof defaultOptions
>

type ModuleHelperResolvers = {
  /**
   * Resolver for paths relative to the module root.
   */
  module: Resolver

  /**
   * Resolve relative to the app's server directory.
   */
  server: Resolver

  /**
   * Resolve relative to the Nuxt src folder.
   */
  src: Resolver

  /**
   * Resolve relative to the Nuxt app directory.
   */
  app: Resolver

  /**
   * Resolve relative to the Nuxt root.
   *
   * Should be where nuxt.config.ts is located.
   */
  root: Resolver
}

type ModuleHelperPaths = {
  runtimeTypes: string
  root: string
  nuxtConfig: string
  serverDir: string
  serverOptions: string | null
  moduleBuildDir: string
}

export class ModuleHelper {
  public readonly resolvers: ModuleHelperResolvers
  public readonly paths: ModuleHelperPaths

  public readonly isDev: boolean

  public readonly options: RequiredModuleOptions

  private nitroExternals: string[] = []
  private tsPaths: Record<string, string> = {}

  constructor(
    public readonly nuxt: Nuxt,
    moduleUrl: string,
    options: ModuleOptions,
  ) {
    // Resolver for the root directory.
    const srcResolver = createResolver(nuxt.options.srcDir)
    const rootResolver = createResolver(nuxt.options.rootDir)

    checkObsoleteOptions(options)

    this.options = options as RequiredModuleOptions

    this.isDev = nuxt.options.dev
    this.resolvers = {
      module: createResolver(moduleUrl),
      server: createResolver(nuxt.options.serverDir),
      src: srcResolver,
      app: createResolver(nuxt.options.dir.app),
      root: rootResolver,
    }

    this.paths = {
      runtimeTypes: '',
      root: nuxt.options.rootDir,
      nuxtConfig: this.resolvers.root.resolve('nuxt.config.ts'),
      serverDir: nuxt.options.serverDir,
      serverOptions: '',
      moduleBuildDir: nuxt.options.buildDir + '/nuxt-multi-cache',
    }

    // This path needs to be built afterwards since the method we call
    // depends on a value of this.paths.
    this.paths.runtimeTypes = this.toModuleBuildRelative(
      this.resolvers.module.resolve('./runtime/types.ts'),
    )

    this.paths.serverOptions = this.findServerOptions()
  }

  /**
   * Find the path to the multiCache.serverOptions.ts file.
   */
  private findServerOptions(): string | null {
    // Look for the file in the server directory.
    const newPath = this.resolvers.server.resolve('multiCache.serverOptions')
    const serverPath = fileExists(newPath)

    if (serverPath) {
      return serverPath
    }

    // Check for previous locations of the server options file that are not
    // supported anymore.
    const candidates: string[] = [
      this.resolvers.root.resolve('multiCache.serverOptions'),
      this.resolvers.root.resolve('app/multiCache.serverOptions'),
      this.resolvers.src.resolve('multiCache.serverOptions'),
    ]

    for (let i = 0; i < candidates.length; i++) {
      const path = candidates[i]
      const filePath = fileExists(path)

      // File exists. Throw an error so that module users can migrate.
      if (filePath) {
        throw new Error(
          `The multiCache.serverOptions file should be placed in Nuxt's <serverDir> ("${this.paths.serverDir}/multiCache.serverOptions.ts").`,
        )
      }
    }

    logger.info('No multiCache.serverOptions file found.')
    return null
  }

  /**
   * Transform the path relative to the module's build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toModuleBuildRelative(path: string): string {
    return relative(this.paths.moduleBuildDir, path)
  }

  /**
   * Transform the path relative to the Nuxt build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toBuildRelative(path: string): string {
    return relative(this.nuxt.options.buildDir, path)
  }

  public addAlias(name: string, path: string) {
    this.nuxt.options.alias[name] = path

    // In our case, the name of the alias corresponds to a folder in the build
    // dir with the same name (minus the #).
    const pathFromName = `./${name.substring(1)}`

    this.tsPaths[name] = pathFromName
    this.tsPaths[name + '/*'] = pathFromName + '/*'

    // Add the alias as an external so that the nitro server build doesn't fail.
    this.inlineNitroExternals(name)
  }

  public inlineNitroExternals(arg: ResolvedNuxtTemplate | string) {
    const path = typeof arg === 'string' ? arg : arg.dst
    this.nitroExternals.push(path)
    this.transpile(path)
  }

  public transpile(path: string) {
    this.nuxt.options.build.transpile.push(path)
  }

  public applyBuildConfig() {
    // Workaround for https://github.com/nuxt/nuxt/issues/28995
    this.nuxt.options.nitro.externals ||= {}
    this.nuxt.options.nitro.externals.inline ||= []
    this.nuxt.options.nitro.externals.inline.push(...this.nitroExternals)

    // Currently needed due to a bug in Nuxt that does not add aliases for
    // nitro. As this has happened before in the past, let's leave it so that
    // we are guaranteed to have these aliases also for server types.
    this.nuxt.options.nitro.typescript ||= {}
    this.nuxt.options.nitro.typescript.tsConfig ||= {}
    this.nuxt.options.nitro.typescript.tsConfig.compilerOptions ||= {}
    this.nuxt.options.nitro.typescript.tsConfig.compilerOptions.paths ||= {}

    this.nuxt.options.typescript.tsConfig ||= {}
    this.nuxt.options.typescript.tsConfig.compilerOptions ||= {}
    this.nuxt.options.typescript.tsConfig.compilerOptions.paths ||= {}

    for (const [name, path] of Object.entries(this.tsPaths)) {
      this.nuxt.options.nitro.typescript.tsConfig.compilerOptions.paths[name] =
        [path]
      this.nuxt.options.typescript.tsConfig.compilerOptions.paths[name] = [path]
    }
  }

  public addPlugin(name: string, mode: 'all' | 'server' | 'client') {
    addPlugin(
      {
        src: this.resolvers.module.resolve('./runtime/plugins/' + name),
        mode,
      },
      {
        append: false,
      },
    )
  }

  public addServerHandler(name: string, path: string, method: RouterMethod) {
    addServerHandler({
      handler: this.resolvers.module.resolve('./runtime/server/api/' + name),
      route: this.options.api.prefix + '/' + path,
      method,
    })
  }

  public addComposable(name: string) {
    addImports({
      from: this.resolvers.module.resolve('./runtime/composables/' + name),
      name,
    })
  }

  public addComponent(name: string) {
    addComponent({
      filePath: this.resolvers.module.resolve(
        './runtime/components/' + name + '/index',
      ),
      name,
      global: true,
    })
  }

  public addServerUtil(name: string) {
    addServerImports([
      {
        from: this.resolvers.module.resolve('./runtime/server/utils/' + name),
        name,
      },
    ])
  }

  public addServerPlugin(name: string) {
    addServerPlugin(
      this.resolvers.module.resolve('./runtime/server/plugins/' + name),
    )
  }

  private processTemplate(_path: string, contents: string): string {
    return contents.trim()
  }

  public addTemplate(template: ModuleTemplate) {
    if (template.build) {
      const content = this.processTemplate(
        template.options.path,
        template.build(this),
      )
      addTemplate({
        filename: template.options.path + '.js',
        write: true,
        getContents: () => content,
      })
    }
    if (template.buildTypes) {
      const content = this.processTemplate(
        template.options.path,
        template.buildTypes(this),
      )
      const filename = template.options.path + '.d.ts'
      addTypeTemplate({
        filename: filename as `${string}.d.ts`,
        write: true,
        getContents: () => content,
      })
    }
  }
}
