import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import getDataCacheItems from './../../__helpers__/getDataCacheItems'
import purgeAll from './../../__helpers__/purgeAll'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The data cache with swr routeRules', () => {
  beforeEach(async () => {
    await purgeAll()
  })
  test('can be used on pages using swr', async () => {
    // Will put the data cache item in cache.
    const page = await createPage('/')
    const time = await page.locator('#current-time').innerText()
    const items = await getDataCacheItems()

    // The time that was put in cache should be the same as the time rendered
    // on the page.
    expect(items.rows.at(0)?.data.data).toEqual(time)

    // Will be served from cache by Nitro.
    const pageSecond = await createPage('/')
    const timeSecond = await pageSecond.locator('#current-time').innerText()
    const itemsSecond = await getDataCacheItems()

    // We should again have the same time.
    expect(itemsSecond.rows.at(0)?.data.data).toEqual(timeSecond)

    // Additionally, the time should still be the same as in the first request.
    expect(time).toEqual(timeSecond)
  })

  test('can be used on event handlers using swr', async () => {
    // Page itself does not have SWR, but it calls an API endpoint that does.
    const page = await createPage('/page-calling-api')
    const time = await page.locator('#current-time').innerText()
    const items = await getDataCacheItems()

    // The cached time is identical to the time on the page.
    expect(items.rows.at(0)?.data.data).toEqual(time)

    // Will be rendered again, however the API response will be served from nitro cache.
    const pageSecond = await createPage('/page-calling-api')
    const timeSecond = await pageSecond.locator('#current-time').innerText()
    const itemsSecond = await getDataCacheItems()

    // We should again have the same time.
    expect(itemsSecond.rows.at(0)?.data.data).toEqual(timeSecond)

    // Additionally, the time should still be the same as in the first request.
    expect(time).toEqual(timeSecond)
  })
})
