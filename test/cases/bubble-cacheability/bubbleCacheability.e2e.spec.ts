import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, test, beforeEach, expect } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
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
}, 10_000)
