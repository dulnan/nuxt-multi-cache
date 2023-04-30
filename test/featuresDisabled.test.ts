import { fileURLToPath } from 'node:url'
import { setup, fetch, $fetch } from '@nuxt/test-utils'
import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheOptions } from '../src/runtime/types'

describe('With all features disabled', async () => {
  const multiCache: NuxtMultiCacheOptions = {
    component: {
      enabled: false,
    },
    data: {
      enabled: false,
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
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig,
  })

  test('No CDN headers are present.', async () => {
    const response = await fetch('/api/cdnHeaders')
    expect(response.headers.get('surrogate-control')).toBeNull()
    expect(response.headers.get('cache-tag')).toBeNull()
  })

  test('Routes are not cached', async () => {
    const rgx = /RANDOM\[(\d*)\]/gm
    // This page is marked as cacheable and renders the value from the query param
    const a: string = await $fetch('/cachedPageWithRandomNumber')
    const randomNumberA = rgx.exec(a)?.[1]

    const b: string = await $fetch('/cachedPageWithRandomNumber')
    const randomNumberB = rgx.exec(b)?.[1]

    expect(randomNumberA).not.toEqual(randomNumberB)
  })

  test('Components are not cached', async () => {
    const rgx = /RANDOM_NUMBER__(\d+)__/gm
    // This page is marked as cacheable and renders the value from the query param
    const a: string = await $fetch('/pageWithCachedComponent')
    const randomNumberA = rgx.exec(a)?.[1]

    const b: string = await $fetch('/pageWithCachedComponent')
    const randomNumberB = rgx.exec(b)?.[1]

    expect(randomNumberA).not.toEqual(randomNumberB)
  })
})
