import { fileURLToPath } from 'node:url'
import { setup, createPage } from '@nuxt/test-utils'
import { describe, expect, test } from 'vitest'
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

  async function getDataValue(path: string, language: string) {
    const page = await createPage(path, {
      javaScriptEnabled: false,
      extraHTTPHeaders: {
        'accept-language': language,
      },
    })
    return page.locator('#data-cache-value').innerText()
  }

  test('is working for the data cache.', async () => {
    await purgeAll()

    const firstDE = await getDataValue('/dataCache', 'de')
    const secondDE = await getDataValue('/dataCache', 'de')
    expect(firstDE).toEqual(secondDE)

    const thirdEN = await getDataValue('/dataCache', 'en')
    expect(firstDE).not.toEqual(thirdEN)
  })

  test('is working for the component cache.', async () => {
    await purgeAll()

    const firstDE = await getDataValue('/pageWithCachedComponent', 'de')
    const secondDE = await getDataValue('/pageWithCachedComponent', 'de')

    // Test that component cache works.
    expect(firstDE).toEqual(secondDE)

    const thirdEN = await getDataValue('/pageWithCachedComponent', 'en')
    expect(thirdEN).not.toEqual(firstDE)
  })

  test('is working for the route cache', async () => {
    await purgeAll()

    const firstDE = await getDataValue('/cachedPageWithRandomNumber', 'de')
    const secondDE = await getDataValue('/cachedPageWithRandomNumber', 'de')
    expect(firstDE).toEqual(secondDE)

    const thirdEN = await getDataValue('/cachedPageWithRandomNumber', 'en')
    expect(firstDE).not.toEqual(thirdEN)
  })
})
