import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
import getComponentCacheItem from '~/test/__helpers__/getComponentCacheItem'
import { parseMaxAge } from '~/src/runtime/helpers/maxAge'
import { createPageWithoutHydration, sleep } from '~/test/__helpers__'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The RenderCacheable component', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('respects making a component uncacheable via useComponentCache', async () => {
    const page1 = await createPage('/uncacheable')
    const timestamp1 = await page1.locator('#timestamp').innerText()
    const page2 = await createPage('/uncacheable')
    const timestamp2 = await page2.locator('#timestamp').innerText()

    expect(timestamp1).not.toEqual(timestamp2)
  })

  test('respects making a component cacheable via useComponentCache', async () => {
    const page1 = await createPage('/cacheable')
    const timestamp1 = await page1.locator('#timestamp').innerText()
    const page2 = await createPage('/cacheable')
    const timestamp2 = await page2.locator('#timestamp').innerText()

    expect(timestamp1).toEqual(timestamp2)
  })

  test('respects setting a lower max age via useComponentCache', async () => {
    await createPage('/max-age-merge')
    const items = await getComponentCacheItem()
    const row = items.at(0)
    const expires = row!.item.expires!

    const now = Math.round(Date.now() / 1000)

    const diff = expires - now

    expect(
      diff,
      'The component sets a max age of 10, so the number of seconds until it expires should be less than the defined max age',
    ).toBeLessThan(15)
  })

  test('sets max age of "0" correctly on component', async () => {
    const page1 = await createPage('/max-age?maxAge=0')
    const timestamp1 = await page1.locator('#timestamp').innerText()
    const page2 = await createPage('/max-age?maxAge=0')
    const timestamp2 = await page2.locator('#timestamp').innerText()

    expect(timestamp1).not.toEqual(timestamp2)
  })

  test('sets max age of "-1" correctly on component', async () => {
    const page1 = await createPage('/max-age?maxAge=-1')
    const timestamp1 = await page1.locator('#timestamp').innerText()
    const page2 = await createPage('/max-age?maxAge=-1')
    const timestamp2 = await page2.locator('#timestamp').innerText()

    expect(timestamp1).toEqual(timestamp2)
  })

  test('sets max age of "1d" correctly on component', async () => {
    const page1 = await createPage('/max-age?maxAge=1d')
    const timestamp1 = await page1.locator('#timestamp').innerText()
    const page2 = await createPage('/max-age?maxAge=1d')
    const timestamp2 = await page2.locator('#timestamp').innerText()

    expect(timestamp1).toEqual(timestamp2)

    const rows = await getComponentCacheItem()
    expect(rows).toHaveLength(1)

    const now = Math.round(Date.now() / 1000)

    const expires = rows.at(0)!.item!.expires!
    const maxAge = expires - now

    const diff = Math.round(maxAge / 60 / 60)

    // Because we use Math.round(), even several seconds will not cause the
    // diff to go to 23.
    expect(diff).toEqual(24)
  })

  test('sets max age of "midnight" correctly on component', async () => {
    const page1 = await createPage('/max-age?maxAge=midnight')
    const timestamp1 = await page1.locator('#timestamp').innerText()
    const page2 = await createPage('/max-age?maxAge=midnight')
    const timestamp2 = await page2.locator('#timestamp').innerText()

    expect(timestamp1).toEqual(timestamp2)

    const rows = await getComponentCacheItem()
    expect(rows).toHaveLength(1)

    const now = Math.round(Date.now() / 1000)

    const expectedMaxAge = Math.round(parseMaxAge('midnight') / 60)

    const expires = rows.at(0)!.item!.expires!
    const maxAge = expires - now

    // Dividing by 60 gives us 1min of time for the test to run, which is way
    // above the actual timeout.
    expect(Math.round(maxAge / 60)).toEqual(expectedMaxAge)
  })

  test('returns a stale component if it throws an error during re-rendering.', async () => {
    const page1 = await createPageWithoutHydration('/stale-if-error', 'en')
    const timestamp1 = await page1.locator('#timestamp').innerText()

    // The max age is 1s, so let's wait for 3s for it to become expired.
    await sleep(3000)

    const page3 = await createPageWithoutHydration(
      '/stale-if-error?throwError=true',
      'en',
    )
    const timestamp3 = await page3.locator('#timestamp').innerText()
    expect(timestamp3, 'Should have returned a stale item from cache').toEqual(
      timestamp1,
    )
  }, 10_000)
})
