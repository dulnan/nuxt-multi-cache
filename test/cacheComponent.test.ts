import { fileURLToPath } from 'node:url'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { NuxtMultiCacheOptions } from '../src/runtime/types'
import purgeAll from './__helpers__/purgeAll'
import { sleep } from './__helpers__'

describe('The component cache feature', async () => {
  const multiCache: NuxtMultiCacheOptions = {
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
    rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
    nuxtConfig,
  })

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
    const NUXT_FIRST = await first
      .evaluateHandle(() => window.__NUXT__)
      .then((v) => v.jsonValue())
    const firstValue = NUXT_FIRST?.data.withAsyncData.api

    expect(firstValue).toMatchInlineSnapshot('"This is data from the API."')

    // Even after caching the page contains the payload.
    const second = await createPage('/payloadData')
    const NUXT_SECOND = await second
      .evaluateHandle(() => window.__NUXT__)
      .then((v: any) => v.jsonValue())
    const secondValue = NUXT_SECOND?.data.withAsyncData.api
    expect(secondValue).toMatchInlineSnapshot('"This is data from the API."')
  })
})
