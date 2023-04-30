import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils'
import { describe, expect, test, vi } from 'vitest'
import { NuxtMultiCacheOptions } from '../src/runtime/types'
import purgeAll from './__helpers__/purgeAll'

describe('The cacheKeyPrefix', async () => {
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

  test('is working for the data cache.', async () => {
    await purgeAll()

    const firstDE = await $fetch('/dataCache', {
      method: 'get',
      headers: {
        'accept-language': 'de',
      },
    })

    const secondDE = await $fetch('/dataCache', {
      method: 'get',
      headers: {
        'accept-language': 'de',
      },
    })

    expect(firstDE).toEqual(secondDE)

    const thirdEN = await $fetch('/dataCache', {
      method: 'get',
      headers: {
        'accept-language': 'en',
      },
    })

    expect(firstDE).not.toEqual(thirdEN)
  })

  test('is working for the component cache.', async () => {
    await purgeAll()
    const firstDE = await $fetch('/pageWithCachedComponent', {
      method: 'get',
      headers: {
        'accept-language': 'de',
      },
    })

    const secondDE = await $fetch('/pageWithCachedComponent', {
      method: 'get',
      headers: {
        'accept-language': 'de',
      },
    })

    // Test that component cache works.
    expect(firstDE).toEqual(secondDE)

    const thirdEN = await $fetch('/pageWithCachedComponent', {
      method: 'get',
      headers: {
        'accept-language': 'en',
      },
    })

    expect(thirdEN).not.toEqual(firstDE)
  })

  test('is working for the route cache', async () => {
    await purgeAll()

    async function performRequest(language: string): Promise<string> {
      const markup = (await $fetch('/cachedPageWithRandomNumber', {
        method: 'get',
        headers: {
          'accept-language': language,
        },
      })) as string
      return [...markup.matchAll(/RANDOM\[(\d*)\]/gm)][0][1]
    }

    const firstDE = await performRequest('de')
    const secondDE = await performRequest('de')

    expect(firstDE).toEqual(secondDE)

    const thirdEN = await performRequest('en')

    expect(firstDE).not.toEqual(thirdEN)
  })
})
