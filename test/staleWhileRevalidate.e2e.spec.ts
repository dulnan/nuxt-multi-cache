import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, test } from 'vitest'
import { expect as playwrightExpect } from '@nuxt/test-utils/playwright'
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

describe('The "stale while revalidate" route cache feature', () => {
  test('returns a stale response if a new one is being revalidated', async () => {
    await purgeAll()

    const page = await createPage('/staleWhileRevalidate')
    await page.locator('#button-fast').click()
    // Wait three seconds. Until then the cached route has already become stale.
    await sleep(3000)

    // Initial fast response shows count 0.
    await playwrightExpect(
      page.locator('#results tr:nth-child(1) .value'),
    ).toHaveText('0')

    // Trigger a slow request that takes 2 seconds.
    await page.locator('#button-slow').click()
    await sleep(500)

    // The new request should be pending.
    await playwrightExpect(
      page.locator('#results tr:nth-child(2) .status'),
    ).toHaveText('pending')

    // Trigger another slow request.
    await page.locator('#button-slow').click()
    await sleep(200)

    // The state should be success, because a stale response was served.
    await playwrightExpect(
      page.locator('#results tr:nth-child(3) .status'),
    ).toHaveText('success')

    // Its value should be stale, which is 0.
    await playwrightExpect(
      page.locator('#results tr:nth-child(3) .value'),
    ).toHaveText('0')

    // Wait for 5 seconds until the request is finished.
    await sleep(2000)

    // The status should not be pending anymore.
    await playwrightExpect(
      page.locator('#results tr:nth-child(2) .status'),
    ).toHaveText('success')

    // And its value should now be 1.
    await playwrightExpect(
      page.locator('#results tr:nth-child(2) .value'),
    ).toHaveText('1')
  })
}, 10_000)
