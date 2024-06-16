import path from 'path'
import { setup } from '@nuxt/test-utils/e2e'
import { describe, test, expect } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
import { createPageWithoutHydration } from './__helpers__'
import purgeAll from './__helpers__/purgeAll'

const multiCache: NuxtMultiCacheOptions = {
  route: {
    enabled: true,
  },
  data: {
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
  rootDir: path.resolve(__dirname, './../playground-disk'),
  nuxtConfig,
})

describe('Caching with the file system driver', () => {
  test('correctly serves a cached page', async () => {
    await purgeAll()
    const page1 = await createPageWithoutHydration('/cachedPageFromDisk', 'en')
    const text1 = await page1.locator('#random-number').innerText()
    const page2 = await createPageWithoutHydration('/cachedPageFromDisk', 'en')
    const text2 = await page2.locator('#random-number').innerText()

    expect(text1).toEqual(text2)

    await purgeAll()

    const page3 = await createPageWithoutHydration('/cachedPageFromDisk', 'en')
    const text3 = await page3.locator('#random-number').innerText()
    expect(text3).to.not.equal(text1)
  })

  test('correctly returns a cached component', async () => {
    await purgeAll()

    const page1 = await createPageWithoutHydration('/cachedComponent', 'en')
    const text1 = await page1.locator('#cached-component-number').innerText()
    const page2 = await createPageWithoutHydration('/cachedComponent', 'en')
    const text2 = await page2.locator('#cached-component-number').innerText()

    expect(text1).toEqual(text2)

    await purgeAll()

    const page3 = await createPageWithoutHydration('/cachedComponent', 'en')
    const text3 = await page3.locator('#cached-component-number').innerText()
    expect(text3).to.not.equal(text1)
  })
})
