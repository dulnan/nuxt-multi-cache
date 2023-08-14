import { fileURLToPath } from 'node:url'
import { setup, $fetch, createPage } from '@nuxt/test-utils'
import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheOptions } from '../src/runtime/types'
import purgeAll from './__helpers__/purgeAll'
import purgeByKey from './__helpers__/purgeByKey'

describe('In SPA mode', async () => {
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

  test('the RenderCacheable component does not throw an exception', async () => {
    await purgeAll()

    // First test that what we try to test actually works.
    const page = await createPage('/spaPageWithException')
    const msgPromise = await page.waitForEvent('console')
    expect(msgPromise.text()).toContain('TypeError')

    // Do our actual test.
    const page2 = await createPage('/spaPageWithCachedComponent')
    const text = await page2.locator('#spa-text').innerText()
    expect(text).toEqual('Component rendered.')
  })

  test('the useDataCache composable does not throw an exception', async () => {
    await purgeAll()

    const page = await createPage('/spaDataCache')
    const text = await page.locator('#data-cache-value').innerText()
    expect(text).toEqual('Success.')
  })
})
