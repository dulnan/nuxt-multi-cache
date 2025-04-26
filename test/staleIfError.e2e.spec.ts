import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'
import { sleep } from './__helpers__'

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
  // browser: true,
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe('The "stale if error" route cache feature', () => {
  test('returns an error if no stale cache item is available', async () => {
    await purgeAll()

    const page = await createPage('/staleIfError')

    expect(await page.locator('#api-result').innerText()).toEqual('0:')

    await page.locator('#button-fail').click()
    await sleep(800)
    expect(await page.locator('#api-result').innerText()).toEqual('1: Error')
  })

  test('returns a stale response if it exists', async () => {
    await purgeAll()

    const page = await createPage('/staleIfError')

    await page.locator('#button-success').click()
    await sleep(500)

    // Get the result which should indicate a successful backend response.
    const result = await page.locator('#api-result').innerText()
    expect(result).toContain('1: Response successful, generated at')

    // Trigger the error request.
    await page.locator('#button-fail').click()
    await sleep(500)
    const resultAfter = await page.locator('#api-result').innerText()
    expect(resultAfter).toContain('2: Response successful, generated at')
    const message = result.split(': ')[1]
    const messageAfter = resultAfter.split(': ')[1]

    // The result should be the same, because it returned a stale response.
    expect(message).toEqual(messageAfter)

    await page.locator('#button-success').click()
    await sleep(500)
    const resultSuccessAgain = await page.locator('#api-result').innerText()
    const messageSuccessAgain = resultSuccessAgain.split(': ')[1]

    // Should not serve cached again, because we triggered the success request.
    expect(messageSuccessAgain).not.toEqual(messageAfter)
  })
})
