import path from 'node:path'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'
import { expect as playwrightExpect } from '@nuxt/test-utils/playwright'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'
import { sleep } from './__helpers__'

const multiCache: ModuleOptions = {
  component: {
    enabled: true,
  },
  data: {
    enabled: false,
  },
  route: {
    enabled: false,
  },
  cdn: {
    enabled: false,
  },
  api: {
    enabled: true,
    authorization: false,
    cacheTagInvalidationDelay: 2000,
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

describe('The component cache feature', () => {
  test('Caches a component', async () => {
    await purgeAll()
    // First call puts it into cache.
    const htmlBefore = await $fetch('/test?v=foobar', {
      method: 'get',
    })
    expect(htmlBefore).toContain('The query value is: foobar')

    // Second call gets it from cache with the old query value.
    const htmlAfter = await $fetch('/test?v=totally-new-value', {
      method: 'get',
    })
    expect(htmlAfter).toContain('The query value is: foobar')
  })

  test('Rerenders purged components', async () => {
    await purgeAll()

    // First call puts it into cache.
    expect(await $fetch('/test?v=foobar')).toContain(
      'The query value is: foobar',
    )

    // Second call gets it from cache with the old query value.
    expect(await $fetch('/test?v=refreshed')).toContain(
      'The query value is: foobar',
    )

    // Remove component from cache.
    await $fetch('/__nuxt_multi_cache/purge/component', {
      method: 'post',
      body: ['en--QueryValue::one'],
    })

    // Third call should render it again with the new value.
    expect(await $fetch('/test?v=refreshed')).toContain(
      'The query value is: refreshed',
    )
  })

  test('Purges components by cache tags', async () => {
    await purgeAll()

    // First call puts it into cache.
    expect(await $fetch('/test?v=foobar')).toContain(
      'The query value is: foobar',
    )

    // Second call gets it from cache with the old query value.
    expect(await $fetch('/test?v=refreshed')).toContain(
      'The query value is: foobar',
    )

    // Remove component from cache by invalidating tag.
    await $fetch('/__nuxt_multi_cache/purge/tags', {
      method: 'post',
      body: ['tag1'],
    })

    // Third call gets it from cache with the old query value because the delay
    // has not yet passed.
    expect(await $fetch('/test?v=refreshed')).toContain(
      'The query value is: foobar',
    )

    await sleep(7000)

    // After the delay, component is rendered again.
    expect(await $fetch('/test?v=refreshed')).toContain(
      'The query value is: refreshed',
    )
  }, 9000)

  test('Respects noCache prop to disable caching', async () => {
    await purgeAll()

    // First call should not put it in cache.
    expect(await $fetch('/noCache?v=one')).toContain('The query value is: one')

    // Second call contains rerendered markup.
    expect(await $fetch('/noCache?v=two')).toContain('The query value is: two')
  })

  test('Caches payload along component if asyncDataKeys provided.', async () => {
    await purgeAll()

    const first = await createPage('/payloadData')
    const firstValue = await first
      .evaluateHandle(
        () => (window.useNuxtApp as any)().payload.data.withAsyncData?.api,
      )
      .then((v) => v.jsonValue())

    expect(firstValue).toMatchInlineSnapshot('"This is data from the API."')

    // Even after caching the page contains the payload.
    const second = await createPage('/payloadData')
    const secondValue = await second
      .evaluateHandle(
        () => (window.useNuxtApp as any)().payload.data.withAsyncData?.api,
      )
      .then((v: any) => v.jsonValue())
    expect(secondValue).toMatchInlineSnapshot('"This is data from the API."')
  })

  test('Remains reactive on the client', async () => {
    const page = await createPage('/cachedComponentWithReactivity')

    await page.locator('#increment').click()

    const count = await page.locator('#count').innerText()
    expect(count).toEqual('1')
    await page.locator('#increment').click()
    await page.locator('#increment').click()
    await playwrightExpect(page.locator('#counter')).toHaveCount(0)
    await page.locator('#increment').click()
    await playwrightExpect(page.locator('#counter')).toHaveCount(1)
    const countAfter = await page.locator('#count').innerText()
    expect(countAfter).toEqual('4')
  })
})
