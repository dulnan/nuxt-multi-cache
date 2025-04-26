import path from 'path'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'
import purgeByKey from './__helpers__/purgeByKey'

const multiCache: ModuleOptions = {
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
    enabled: true,
    authorization: false,
    cacheTagInvalidationDelay: 5000,
  },
}
const nuxtConfig: any = {
  multiCache,
}

describe('The data cache feature', async () => {
  await setup({
    server: true,
    logLevel: 0,
    runner: 'vitest',
    build: true,
    // browser: true,
    rootDir: path.resolve(__dirname, './../playground'),
    nuxtConfig,
  })
  test('Works on a page', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await createPage('/dataCache')
    const firstId = await first.locator('#data-cache-value').getAttribute('id')

    // Second call should get it from cache.
    const second = await createPage('/dataCache')
    const secondId = await second
      .locator('#data-cache-value')
      .getAttribute('id')

    expect(firstId).toEqual(secondId)
  })

  test('Works in a server handler', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await $fetch('/api/dataCache', {
      method: 'get',
    })

    // Second call should get it from cache.
    const second = await $fetch('/api/dataCache', {
      method: 'get',
    })

    expect(first).toEqual(second)
  })

  test('has its cache entries invalidated correctly', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await $fetch('/api/dataCache', {
      method: 'get',
    })

    // Second call should get it from cache.
    const second = await $fetch('/api/dataCache', {
      method: 'get',
    })

    expect(first).toEqual(second)

    await purgeByKey('data', 'en--apiDataCacheTest')

    // Third call should not use cached entry.
    const third = await $fetch('/api/dataCache', {
      method: 'get',
    })

    expect(third).not.toEqual(first)
    expect(third).not.toEqual(second)
  })
})
