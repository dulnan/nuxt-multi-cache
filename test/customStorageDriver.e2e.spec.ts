import path from 'path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'

const multiCache: NuxtMultiCacheOptions = {
  component: {
    enabled: false,
  },
  data: {
    enabled: true,
  },
  route: {
    enabled: false,
  },
  cdn: {
    enabled: false,
  },
  api: {
    enabled: false,
    authorization: false,
    cacheTagInvalidationDelay: 5000,
  },
}
const nuxtConfig: any = {
  multiCache,
}
await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  // browser: true,
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe('The data cache feature', () => {
  test('Uses a custom storage driver.', async () => {
    const data = await $fetch('/api/customStorageDriver', {
      method: 'get',
    })

    expect(data).toMatchInlineSnapshot(`
      {
        "value": "just_an_example_value",
      }
    `)
  })
})
