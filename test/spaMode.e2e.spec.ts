import path from 'path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
import purgeAll from './__helpers__/purgeAll'
import { sleep } from './__helpers__'

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
  browser: true,
  nuxtConfig,
  rootDir: path.resolve(__dirname, './../playground'),
})

describe('In SPA mode', () => {
  test('the RenderCacheable component does not throw an exception', async () => {
    await purgeAll()

    // First test that what we try to test actually works.
    const page = await createPage('/spaPageWithException')
    const errorText = await page.locator('body').innerText()

    expect(errorText).toContain('500')

    // Do our actual test.
    const page2 = await createPage('/spaPageWithCachedComponent')
    const text = await page2.locator('#spa-text').innerText()
    expect(text).toEqual('Component rendered.')
  })

  test('the useDataCache composable does not throw an exception', async () => {
    await purgeAll()

    const page = await createPage('/spaDataCache')
    await sleep(1000)
    const text = await page.locator('#data-cache-value').innerText()
    expect(text).toEqual('Success')
  })
})
