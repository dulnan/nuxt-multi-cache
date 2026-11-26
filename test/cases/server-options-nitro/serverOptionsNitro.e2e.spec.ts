import path from 'node:path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import getDataCacheItems from './../../__helpers__/getDataCacheItems'
import getRouteCacheItems from './../../__helpers__/getRouteCacheItems'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('A server options file that imports from nitropack/runtime', () => {
  test('is used by the composables of the Nuxt app', async () => {
    expect(await $fetch('/about')).toContain('Hello')

    // The cache key prefix comes from Nitro's runtime config.
    const dataKeys = (await getDataCacheItems()).rows.map((row) => row.key)
    expect(dataKeys).toEqual(['from-runtime-config--greeting'])

    const routeKeys = (await getRouteCacheItems()).map((row) => row.key)
    expect(routeKeys).toContain('from-runtime-config--:about')
  })

  test('is only bundled into the Nitro build', async () => {
    await $fetch('/about')

    // A copy in the build of the Nuxt app would create the server options a
    // second time, with Nuxt's runtime instead of Nitro's.
    expect(await $fetch('/api/server-options-calls')).toEqual(1)
  })
})
