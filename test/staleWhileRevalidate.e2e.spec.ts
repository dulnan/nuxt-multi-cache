import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/runtime/types'
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
    // Wait for a second. Until then the cached route has already become stale.
    await sleep(1000)

    // Initial fast response shows count 0.
    expect(
      await page.locator('#results tr:nth-child(1) .value').innerText(),
    ).toEqual('0')

    // Trigger a slow request that takes 2 seconds.
    await page.locator('#button-slow').click()
    await sleep(200)

    // The new request should be pending.
    expect(
      await page.locator('#results tr:nth-child(2) .status').innerText(),
    ).toEqual('pending')

    // Trigger another slow request.
    await page.locator('#button-slow').click()
    await sleep(200)

    // The state should be success, because a stale response was served.
    expect(
      await page.locator('#results tr:nth-child(3) .status').innerText(),
    ).toEqual('success')

    // Its value should be stale, which is 0.
    expect(
      await page.locator('#results tr:nth-child(3) .value').innerText(),
    ).toEqual('0')

    // Wait for 5 seconds until the request is finished.
    await sleep(2000)

    // The status should not be pending anymore.
    expect(
      await page.locator('#results tr:nth-child(2) .status').innerText(),
    ).toEqual('success')

    // And its value should now be 1.
    expect(
      await page.locator('#results tr:nth-child(2) .value').innerText(),
    ).toEqual('1')
  })
}, 10_000)
