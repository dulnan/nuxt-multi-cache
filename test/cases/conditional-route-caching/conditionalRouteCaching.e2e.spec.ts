import path from 'node:path'
import { setup, createPage, useTestContext, url } from '@nuxt/test-utils/e2e'
import { describe, test, beforeEach } from 'vitest'
import { expect as playwrightExpect } from '@nuxt/test-utils/playwright'
import purgeAll from '~/test/__helpers__/purgeAll'
import getRouteCacheItems from '~/test/__helpers__/getRouteCacheItems'
import { createPageWithoutHydration } from '~/test/__helpers__'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

async function assertRouteCacheItemsLength(
  length: number,
  message: string,
): Promise<void> {
  const routeItems = await getRouteCacheItems()
  playwrightExpect(routeItems, message).toHaveLength(length)
}

describe('Conditional route caching', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('is serving from cache without a cookie', async () => {
    await assertRouteCacheItemsLength(0, 'No items initially')
    const page = await createPageWithoutHydration('/', 'en')
    const value1 = await page.locator('#time').innerText()
    await assertRouteCacheItemsLength(
      1,
      'One item because first request was cached',
    )
    await page.reload()
    const value2 = await page.locator('#time').innerText()

    playwrightExpect(
      value1,
      'Should be the same because served from cache.',
    ).toEqual(value2)

    await assertRouteCacheItemsLength(1, 'Still one item')
  }, 10_000)

  test('is not serving from cache with a cookie', async () => {
    await assertRouteCacheItemsLength(0, 'No items initially')
    const page = await createPage('/')
    const value1 = await page.locator('#time').innerText()
    await assertRouteCacheItemsLength(
      1,
      'One item because first request was cached without cookie',
    )
    await page.locator('#login').click()
    await page.reload()

    const value2 = await page.locator('#time').innerText()

    playwrightExpect(
      value1,
      'Should not be the same because not served from cache.',
    ).not.toEqual(value2)
    await assertRouteCacheItemsLength(1, 'Still only one item')
  }, 10_000)

  test('is not serving from nor storing in cache when a cookie is already present', async () => {
    const ctx = useTestContext()
    const page = await createPage(undefined, {
      javaScriptEnabled: false,
    })
    await assertRouteCacheItemsLength(0, 'No items initially')
    const context = page.context()
    const randomCookie = Math.round(Math.random() * 9999999999).toString()
    await context.addCookies([
      {
        name: 'COOKIE_KEY_SESSION_TOKEN',
        value: randomCookie,
        url: ctx.url,
      },
    ])
    await page.goto(url('/'))

    const cookieValue = await page.locator('#cookie').innerText()

    playwrightExpect(
      cookieValue,
      'Can contain cookie value because it was SSR rendered as such',
    ).toEqual(randomCookie)
    await assertRouteCacheItemsLength(
      0,
      'Still zero items because none were cached.',
    )
  }, 10_000)
})
