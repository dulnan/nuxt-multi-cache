import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'
import type { Nuxt } from 'nuxt/schema'
import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ModuleHelper } from '../../src/build/ModuleHelper'
import { logger } from '../../src/build/logger'

/**
 * A Nuxt instance with the given layers. The first one is the app.
 */
function createNuxt(layers: string[]): Nuxt {
  const [rootDir] = layers as [string]
  return {
    options: {
      rootDir,
      srcDir: join(rootDir, 'app'),
      serverDir: join(rootDir, 'server'),
      buildDir: join(rootDir, '.nuxt'),
      dir: { app: 'app' },
      dev: false,
      alias: {},
      _layers: layers.map((dir) => ({
        cwd: dir,
        config: {
          rootDir: dir,
          srcDir: join(dir, 'app'),
          serverDir: join(dir, 'server'),
        },
      })),
    },
  } as unknown as Nuxt
}

describe('The server options file', () => {
  let root = ''

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'nuxt-multi-cache-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  /**
   * Create a directory per layer, with a server options file for each name
   * that ends with "*".
   */
  function createLayers(...names: string[]): string[] {
    return names.map((name) => {
      const dir = join(root, name.replace('*', ''))
      mkdirSync(join(dir, 'server'), { recursive: true })
      if (name.endsWith('*')) {
        writeFileSync(join(dir, 'server/multiCache.serverOptions.ts'), '')
      }
      return dir
    })
  }

  function getServerOptionsPath(layers: string[]): string | null {
    return new ModuleHelper(createNuxt(layers), import.meta.url, {}).paths
      .serverOptions
  }

  test('is the one of the app if the app and a layer have one', () => {
    const layers = createLayers('app*', 'base*')
    expect(getServerOptionsPath(layers)).toBe(
      join(root, 'app/server/multiCache.serverOptions.ts'),
    )
  })

  test('is the one of a layer if the app has none', () => {
    const info = vi.spyOn(logger, 'info')
    const layers = createLayers('app', 'base*')
    expect(getServerOptionsPath(layers)).toBe(
      join(root, 'base/server/multiCache.serverOptions.ts'),
    )
    expect(info).toHaveBeenCalledWith(
      'Using the server options of a layer: ../base/server/multiCache.serverOptions.ts',
    )
  })

  test('is the one of the layer with the highest priority', () => {
    const layers = createLayers('app', 'first*', 'second*')
    expect(getServerOptionsPath(layers)).toBe(
      join(root, 'first/server/multiCache.serverOptions.ts'),
    )
  })

  test('is not used if no layer has one', () => {
    const layers = createLayers('app', 'base')
    expect(getServerOptionsPath(layers)).toBeNull()
  })
})

describe('The Nitro preset', () => {
  let root = ''

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'nuxt-multi-cache-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  function setNitroPreset(
    preset: string,
    cacheTagInvalidationDelay?: number,
  ): ModuleHelper {
    const helper = new ModuleHelper(createNuxt([root]), import.meta.url, {
      api: { cacheTagInvalidationDelay },
    })
    helper.setNitroPreset(preset)
    return helper
  }

  test('is stored', () => {
    expect(setNitroPreset('cloudflare-module').nitroPreset).toBe(
      'cloudflare-module',
    )
  })

  test('logs that a cache tag invalidation delay is ignored on Cloudflare', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    setNitroPreset('cloudflare-pages', 5000)
    expect(warn).toHaveBeenCalledWith(
      `The api.cacheTagInvalidationDelay of 5000 ms is ignored for the "cloudflare-pages" preset: Cloudflare Workers don't run timers after the response has been sent, so cache tags are purged during the request.`,
    )
  })

  test.each([
    [undefined, 'cloudflare-module'],
    [0, 'cloudflare-module'],
    [5000, 'node-server'],
  ])(
    'logs nothing for a cache tag invalidation delay of %j and the %s preset',
    (cacheTagInvalidationDelay, preset) => {
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      setNitroPreset(preset, cacheTagInvalidationDelay)
      expect(warn).not.toHaveBeenCalled()
    },
  )
})

describe('The runtime types for the generated Nitro types', () => {
  test('resolve to the runtime types file', () => {
    const root = mkdtempSync(join(tmpdir(), 'nuxt-multi-cache-'))
    try {
      const helper = new ModuleHelper(
        createNuxt([root]),
        new URL('../../src/module.ts', import.meta.url).href,
        {},
      )
      // The generated types import the path from the module's build dir.
      const { resolvedModule } = ts.resolveModuleName(
        helper.paths.runtimeTypes,
        join(helper.paths.moduleBuildDir, 'nitro.d.ts'),
        {
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          allowImportingTsExtensions: true,
          noEmit: true,
        },
        ts.sys,
      )
      expect(resolvedModule?.resolvedFileName).toBe(
        fileURLToPath(
          new URL('../../src/runtime/types/index.ts', import.meta.url),
        ),
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
