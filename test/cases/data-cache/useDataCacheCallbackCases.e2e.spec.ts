import path from 'node:path'
import { setup, createPage, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import { expect as playwrightExpect } from '@nuxt/test-utils/playwright'
import purgeAll from './../../__helpers__/purgeAll'
import { sleep } from '~/test/__helpers__'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The useDataCacheCallback composable', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('returns stale data when there is an error', async () => {
    const page1 = await createPage('/stale-if-error')
    const value1 = await page1.locator('#data').innerText()
    await playwrightExpect(page1.locator('#status')).toContainText('success')

    await page1.reload()

    await playwrightExpect(
      page1.locator('#data'),
      'should have the same data because not yet expired',
    ).toHaveText(value1)

    // The max age is 2s, so let's wait for it to become expired.
    await sleep(4000)

    const page2 = await createPage('/stale-if-error?throwError=true')

    await playwrightExpect(
      page2.locator('#data'),
      'should return stale data because the callback has thrown an error.',
    ).toHaveText(value1)
    await playwrightExpect(page2.locator('#status')).toContainText('success')
  }, 10_000)

  test('throws an error when there is no stale data to return', async () => {
    const page2 = await createPage('/stale-if-error?throwError=true')

    await playwrightExpect(page2.locator('#data')).toBeEmpty()
    await playwrightExpect(page2.locator('#error')).toContainText(
      'Error: Unexpected Error',
    )
    await playwrightExpect(page2.locator('#status')).toContainText('error')
  }, 10_000)
})

describe('The data cache', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('does not store data under a key cut off at "?"', async () => {
    // The query value is decoded to "shoes?casino", which the storage would
    // cut off to the key of the search "shoes".
    await fetch('/search?q=shoes%3Fcasino')

    const html = await fetch('/search?q=shoes').then((r) => r.text())
    expect(html).toContain('RESULTS:shoes')
    expect(html).not.toContain('casino')
  })
})
