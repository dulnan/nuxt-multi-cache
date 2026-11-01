import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import purgeAll from '~/test/__helpers__/purgeAll'
import { sleep } from '~/test/__helpers__'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '~/src/runtime/helpers/constants'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

const NOW = new Date('2026-01-01T12:00:00.000Z')

// The routes have a max age of 60 seconds.
const EXPIRED = new Date(NOW.getTime() + 120_000)

// Browsers request pages with an Accept header for HTML, for which Nuxt's
// error handler renders its error page.
async function request(url: string, date = NOW) {
  const response = await fetch(url, {
    headers: {
      [TEST_MODE_DATE_OVERRIDE_HEADER]: date.toISOString(),
      accept: 'text/html',
    },
  })
  return {
    status: response.status,
    body: await response.text(),
    cacheStatus: response.headers.get('cache-status'),
  }
}

describe('The error handler of the route cache', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('serves the stale route if a server route fails', async () => {
    const first = await request('/stale-if-error')
    const failed = await request('/stale-if-error?fail=true', EXPIRED)
    expect(failed.status).toEqual(200)
    expect(failed.body).toEqual(first.body)
    expect(failed.cacheStatus).toEqual(
      'nuxt-multi-cache; fwd=stale; fwd-status=503; ttl=-60',
    )
  })

  test('serves the stale route if rendering a page fails', async () => {
    const first = await request('/page')
    const failed = await request('/page?fail=true', EXPIRED)
    expect(failed.status).toEqual(200)
    expect(failed.body).toEqual(first.body)
    expect(failed.cacheStatus).toEqual(
      'nuxt-multi-cache; fwd=stale; fwd-status=500; ttl=-60',
    )
  })

  test('does not store the stale route again', async () => {
    const first = await request('/page')
    await request('/page?fail=true', EXPIRED)

    // Still expired, so the page is rendered again.
    const next = await request('/page', EXPIRED)
    expect(next.body).not.toEqual(first.body)
  })

  test('responds normally if a non-fatal error was captured', async () => {
    const first = await request('/stale-if-error')
    const captured = await request('/stale-if-error?capture=true', EXPIRED)
    expect(captured.status).toEqual(200)
    expect(captured.body).not.toEqual(first.body)
  })

  test('keeps serving the stale route while a request that captured a non-fatal error revalidates it', async () => {
    const first = await request('/swr')

    // Expired: This request revalidates the route, which takes a second.
    const revalidating = request('/swr?capture=true&delay=1000', EXPIRED)
    await sleep(300)

    // Another request gets the stale route.
    expect((await request('/swr', EXPIRED)).body).toEqual(first.body)
    expect((await revalidating).body).not.toEqual(first.body)
  })

  test('revalidates the route again after a revalidation failed', async () => {
    const first = await request('/swr')

    // Expired: This request revalidates the route and fails.
    expect((await request('/swr?fail=true', EXPIRED)).status).toEqual(503)

    // The route is no longer being revalidated, so this request revalidates
    // it, instead of getting the stale route.
    expect((await request('/swr', EXPIRED)).body).not.toEqual(first.body)
  })
})
