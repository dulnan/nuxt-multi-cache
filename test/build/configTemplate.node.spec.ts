import { describe, expect, test } from 'vitest'
import configTemplate from '../../src/build/templates/definitions/config'
import type { ModuleHelper } from '../../src/build/ModuleHelper'
import type { ModuleOptions } from '../../src/build/options'

function renderConfig(options: ModuleOptions, nitroPreset = 'node-server') {
  return configTemplate.build!({
    options,
    nitroPreset,
  } as unknown as ModuleHelper)
}

describe('The config template', () => {
  test.each([
    [undefined, 60000],
    [0, 0],
    [5000, 5000],
  ])(
    'sets a cache tag invalidation delay of %j to %j',
    (cacheTagInvalidationDelay, expected) => {
      expect(renderConfig({ api: { cacheTagInvalidationDelay } })).toContain(
        `export const cacheTagInvalidationDelay = ${expected}\n`,
      )
    },
  )

  test.each([
    'cloudflare-module',
    'cloudflare-module-legacy',
    'cloudflare-pages',
    'cloudflare-durable',
  ])('sets a cache tag invalidation delay of 0 for %s', (preset) => {
    for (const cacheTagInvalidationDelay of [undefined, 5000]) {
      expect(
        renderConfig({ api: { cacheTagInvalidationDelay } }, preset),
      ).toContain(`export const cacheTagInvalidationDelay = 0\n`)
    }
  })

  test.each([
    [undefined, 0],
    [false, 0],
    [true, 5000],
    [15_000, 15000],
  ])('sets the coalescing timeout of %j to %j', (coalesce, expected) => {
    expect(renderConfig({ route: { enabled: true, coalesce } })).toContain(
      `export const routeCacheCoalesce = ${expected}\n`,
    )
  })
})
