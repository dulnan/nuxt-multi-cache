import path from 'node:path'
import { setup, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'

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

describe('The multi cache context', () => {
  test('is not shared in the same event context', async () => {
    await purgeAll()

    // Should put it in cache, because the page itself is cacheable.
    const page = await createPage('/cachedPageWithUncacheableApi')

    // The value.
    const dataA = await page.locator('#api-data').innerText()

    // Reload the page. It should be served from cache, even if the API call
    // it's doing is uncacheable.
    await page.reload()
    const dataB = await page.locator('#api-data').innerText()

    expect(dataB).toEqual(dataA)
  })
})
