import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, test, beforeEach, expect } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
import purgeByKey from './../../__helpers__/purgeByKey'
import getRouteCacheItems from './../../__helpers__/getRouteCacheItems'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'
import { sleep } from '~/test/__helpers__'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

async function testCase(
  url: string,
  maxAge: number,
  staleIfError: number,
  cacheTags: string[],
) {
  const cacheTagsExpected = [...cacheTags].sort().join(' ')
  const response = await fetch(url)
  const control = response.headers.get('surrogate-control') ?? ''
  const tagsValue = (response.headers.get('cache-tag') ?? '')
    .split(' ')
    .sort()
    .join(' ')

  expect(control, `Uses the lower max age on first render`).toContain(
    'max-age=' + maxAge,
  )
  expect(control, `Uses the lower stale-if-error on first render`).toContain(
    'stale-if-error=' + staleIfError,
  )
  expect(tagsValue, `Merges cache tags on first render`).toContain(
    cacheTagsExpected,
  )

  // Wait for two seconds.
  await sleep(2000)

  const responseSecond = await fetch(url)
  const controlSecond = responseSecond.headers.get('surrogate-control') ?? ''
  const tagsValueSecond = (responseSecond.headers.get('cache-tag') ?? '')
    .split(' ')
    .sort()
    .join(' ')

  const [maxAgeSecond, staleIfErrorSecond] = controlSecond
    .split(' ')
    .map((v) => {
      const value = v.split('=')[1]!
      return parseInt(value)
    })

  expect(
    maxAgeSecond,
    `Uses the lower max age on second render, accounting for delay between requests.`,
  ).toBeLessThan(maxAge)
  expect(
    maxAgeSecond,
    `Uses the lower max age on second render, accounting for delay between requests.`,
  ).toBeGreaterThanOrEqual(maxAge - 4)
  expect(
    staleIfErrorSecond,
    `Uses the lower stale-if-error on second render, accounting for delay between requests`,
  ).toBeGreaterThanOrEqual(staleIfError - 4)

  expect(tagsValueSecond, `Merges cache tags on second render`).toContain(
    cacheTagsExpected,
  )
}

describe('The "bubble cacheability" feature', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('Merges cacheability from RenderCacheable', async () => {
    await testCase('/component', 1000, 18000, [
      'tag-from-route',
      'tag-from-component',
    ])
  })

  test('Merges cacheability from useDataCache', async () => {
    await testCase('/use-data-cache', 1000, 1000, [
      'tag-from-route',
      'tag-from-data-cache',
    ])
  })

  test('Merges cacheability from useDataCacheCallback', async () => {
    await testCase('/use-data-cache-callback', 100, 18000, [
      'tag-from-route',
      'tag-from-callback',
    ])
  })

  test('Keeps the max age when merging a data cache item without max age', async () => {
    // The first request stores the data cache item, the second one loads it.
    for (const request of ['miss', 'hit']) {
      const response = await fetch('/use-data-cache-permanent')
      const control = response.headers.get('surrogate-control') ?? ''
      expect(control, request).toContain('max-age=9000')

      const items = await getRouteCacheItems()
      expect(items, request).toHaveLength(1)
      const expires = items[0]!.item.expires
      expect(expires - toTimestamp(new Date()), request).toBeGreaterThan(8990)

      // So that the next request is not served from the route cache.
      await purgeByKey('route', items[0]!.key)
    }
  })
}, 10_000)
