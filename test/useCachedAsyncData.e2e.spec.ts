import path from 'path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
import purgeAll from './__helpers__/purgeAll'
import getDataCacheItems from './__helpers__/getDataCacheItems'

const multiCache: NuxtMultiCacheOptions = {
  component: {
    enabled: true,
  },
  data: {
    enabled: true,
  },
  route: {
    enabled: true,
  },
  cdn: {
    enabled: true,
  },
  api: {
    enabled: true,
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
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe('The useCachedAsyncData composable', () => {
  test.only('Puts the handler result into the cache', async () => {
    await purgeAll()

    // First call puts it into cache.
    await createPage('/useCachedAsyncData')

    const data: any = await getDataCacheItems()
    const item = data.rows.find((v) => v.key === 'en--all-users')

    expect(item).toBeTruthy()
    expect(item.data.cacheTags).toMatchInlineSnapshot(`
      [
        "user:39a2cbd1-5355-42ee-b519-a378ac12ecf4",
        "user:21ef84d0-fc1e-44f6-8ba7-038eba022140",
        "user:b7c1f5eb-d8ca-4e55-8327-c0fd27029cfc",
        "user:bbaf0d1b-a446-4f68-b745-c61cd4b5adf6",
        "user:4aeac8ae-7ddf-4f8d-a015-3b059f00b554",
      ]
    `)
    expect(item.data.expires).toBeTruthy()
  })
})
