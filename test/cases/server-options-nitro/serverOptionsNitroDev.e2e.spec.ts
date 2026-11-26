import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import getDataCacheItems from './../../__helpers__/getDataCacheItems'

// In dev mode, Nitro's virtual modules, which nitropack/runtime imports, only
// resolve in Nitro, not in the server build of the Nuxt app.
await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  dev: true,
  rootDir: path.resolve(__dirname, './nuxt'),
  nuxtConfig: {
    multiCache: {
      // The dev server's logs end up in the test output.
      disableCacheOverviewLogMessage: true,
    },
  },
})

describe('In dev mode, a server options file that imports from nitropack/runtime', () => {
  test('is used by the composables of the Nuxt app', async () => {
    const response = await fetch('/about')
    expect(response.status).toEqual(200)
    expect(await response.text()).toContain('Hello')

    const dataKeys = (await getDataCacheItems()).rows.map((row) => row.key)
    expect(dataKeys).toEqual(['from-runtime-config--greeting'])
  })
})
