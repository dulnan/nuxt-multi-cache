import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import type { Nuxt } from 'nuxt/schema'
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
