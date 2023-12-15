import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheOptions } from '../src/runtime/types'
import purgeAll from './__helpers__/purgeAll'

describe('The route cache feature', async () => {
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
    // browser: true,
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig,
  })

  test('caches a page', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

    // Second call should get it from cache.
    const second = await $fetch('/cachedPageWithRandomNumber', {
      method: 'get',
    })

    expect(first).toEqual(second)
  })

  test('does not cache a page marked uncacheable', async () => {
    await purgeAll()

    // First call puts it into cache.
    const first = await $fetch('/uncacheablePage', {
      method: 'get',
    })

    // Second call should get it from cache.
    const second = await $fetch('/uncacheablePage', {
      method: 'get',
    })

    expect(first).not.toEqual(second)
  })
})
