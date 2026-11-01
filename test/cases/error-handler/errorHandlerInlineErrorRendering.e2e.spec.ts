import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import purgeAll from '~/test/__helpers__/purgeAll'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '~/src/runtime/helpers/constants'

// Nuxt renders the error page in the same request and only reports the error
// via captureError, instead of throwing it to Nitro's error handler. The
// default with `future.compatibilityVersion: 5`.
await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
  nuxtConfig: {
    experimental: {
      inlineErrorRendering: true,
    },
  } as any,
})

const NOW = new Date('2026-01-01T12:00:00.000Z')

// The routes have a max age of 60 seconds.
const EXPIRED = new Date(NOW.getTime() + 120_000)

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

describe('The error handler of the route cache with inline error rendering', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('serves the stale route if a server route fails', async () => {
    const first = await request('/stale-if-error')
    const failed = await request('/stale-if-error?fail=true', EXPIRED)
    expect(failed.status).toEqual(200)
    expect(failed.body).toEqual(first.body)
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
})
