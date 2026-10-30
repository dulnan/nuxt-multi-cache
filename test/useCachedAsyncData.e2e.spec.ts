import path from 'path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import { expect as playwrightExpect } from '@nuxt/test-utils/playwright'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'
import getDataCacheItems from './__helpers__/getDataCacheItems'

const multiCache: ModuleOptions = {
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

async function hasDataCacheItem(key: string): Promise<boolean> {
  const items = await getDataCacheItems()
  return items.rows.some((v) => v.key.endsWith(key))
}

describe('The useCachedAsyncData composable', () => {
  test('Puts the handler result into the cache', async () => {
    await purgeAll()

    // First call puts it into cache.
    await createPage('/useCachedAsyncData?vary=one')

    const data = await getDataCacheItems()
    const item = data.rows.find((v) => v.key === 'en--all-users--one')

    expect(item).toBeTruthy()
    expect(item!.data.cacheTags).toMatchInlineSnapshot(`
      [
        "user:39a2cbd1-5355-42ee-b519-a378ac12ecf4",
        "user:21ef84d0-fc1e-44f6-8ba7-038eba022140",
        "user:b7c1f5eb-d8ca-4e55-8327-c0fd27029cfc",
        "user:bbaf0d1b-a446-4f68-b745-c61cd4b5adf6",
        "user:4aeac8ae-7ddf-4f8d-a015-3b059f00b554",
      ]
    `)
    expect(item!.data.expires).toBeTruthy()
  })

  test('treats a max age of 5 as cacheable on the client', async () => {
    await purgeAll()

    const page = await createPage('/useCachedAsyncData')
    const number1 = await page.locator('#time').innerText()

    await page.locator('#go-to-home').click()
    await page.locator('#route-useCachedAsyncData').click()
    const number2 = await page.locator('#time').innerText()

    expect(number1).toEqual(number2)
  })

  test('caches on the server with a serverMaxAge of 60', async () => {
    await purgeAll()

    const url = '/cachedAsyncDataMaxAge?server=60'
    const page1 = await createPage(url)
    const time1 = await page1.locator('#time').innerText()
    const page2 = await createPage(url)
    const time2 = await page2.locator('#time').innerText()

    expect(time1).toEqual(time2)
    expect(await hasDataCacheItem('max-age--60--undefined')).toBe(true)
  })

  test.each(['0', 'never', 'undefined'])(
    'does not cache on the server with a serverMaxAge of %s',
    async (maxAge) => {
      await purgeAll()

      const url = `/cachedAsyncDataMaxAge?server=${maxAge}`
      const page1 = await createPage(url)
      const time1 = await page1.locator('#time').innerText()
      const page2 = await createPage(url)
      const time2 = await page2.locator('#time').innerText()

      expect(time1).not.toEqual(time2)
      expect(await hasDataCacheItem(`max-age--${maxAge}--undefined`)).toBe(
        false,
      )
    },
  )

  test.each(['0', 'never', 'undefined'])(
    'does not cache on the client with a clientMaxAge of %s',
    async (maxAge) => {
      await purgeAll()

      const page = await createPage(`/cachedAsyncDataMaxAge?client=${maxAge}`)
      const time1 = await page.locator('#time').innerText()

      await page.locator('#go-to-home').click()
      await page.waitForURL((url) => url.pathname === '/')
      await page.goBack()

      await playwrightExpect(page.locator('#time')).not.toHaveText(time1)
    },
  )

  test.each(['5', '5m', 'permanent', '-1'])(
    'caches on the client with a clientMaxAge of %s',
    async (maxAge) => {
      await purgeAll()

      const page = await createPage(`/cachedAsyncDataMaxAge?client=${maxAge}`)
      const time1 = await page.locator('#time').innerText()

      await page.locator('#go-to-home').click()
      await page.waitForURL((url) => url.pathname === '/')
      await page.goBack()

      await playwrightExpect(page.locator('#time')).toHaveText(time1)
    },
  )

  test('works using a reactive key', async () => {
    await purgeAll()

    const page = await createPage('/useCachedAsyncDataReactiveKey')
    await playwrightExpect(page.locator('#api-value')).toHaveText('0')
    const initialTimestamp = await page.locator('#api-timestamp').innerText()

    await page.locator('#increment').click()
    await playwrightExpect(page.locator('#api-value')).toHaveText('1')
    await page.locator('#increment').click()
    await playwrightExpect(page.locator('#api-value')).toHaveText('2')
    await page.locator('#decrement').click()
    await page.locator('#decrement').click()

    const timestamp = await page.locator('#api-timestamp').innerText()
    // It should be the same timestamp as initially, because it's still within
    // the specificed clientMaxAge, so the response from cache is used.
    expect(initialTimestamp).toEqual(timestamp)

    // And it should again be 0.
    await playwrightExpect(page.locator('#api-value')).toHaveText('0')
  })
}, 8_000)
