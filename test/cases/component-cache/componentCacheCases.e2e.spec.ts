import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
import getComponentCacheItem from '~/test/__helpers__/getComponentCacheItem'

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
})
