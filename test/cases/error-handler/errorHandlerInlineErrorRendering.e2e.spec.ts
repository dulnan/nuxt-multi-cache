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
    headers: response.headers,
  }
}

async function setBackendDown(down: boolean) {
  await fetch(`/backend?down=${down}`, { method: 'POST' })
}

// The tags of the errors that Nitro captured since the last call.
async function getCapturedErrorTags(): Promise<string[][]> {
  return (await fetch('/captured-error-tags')).json()
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
    await getCapturedErrorTags()
    const failed = await request('/page?fail=true', EXPIRED)

    // Nuxt rendered the error inline: It reports the error with the "ssr" tag
    // instead of throwing it to the error handler.
    expect(await getCapturedErrorTags()).toContainEqual(
      expect.arrayContaining(['ssr']),
    )

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

  test("does not let Nitro's cache store the stale page", async () => {
    const first = await request('/nitro-cached?v=1')

    await setBackendDown(true)
    try {
      const failed = await request('/nitro-cached?v=2', EXPIRED)
      expect(failed.status).toEqual(200)
      expect(failed.body).toEqual(first.body)
    } finally {
      await setBackendDown(false)
    }

    // Nitro's cache has no entry for this URL, so the page is rendered.
    const recovered = await request('/nitro-cached?v=2', EXPIRED)
    expect(recovered.body).not.toEqual(first.body)
  })

  test('revalidates the page again after a revalidation failed', async () => {
    const first = await request('/swr-page')

    // Expired: This request revalidates the page and fails.
    expect((await request('/swr-page?fail=true', EXPIRED)).status).toEqual(500)

    // The page is no longer being revalidated, so this request revalidates it,
    // instead of getting the stale page.
    expect((await request('/swr-page', EXPIRED)).body).not.toEqual(first.body)
  })

  test.each(['/stale-if-error', '/page'])(
    'sends only the headers of the stale route for %s',
    async (path) => {
      await request(path)
      const failed = await request(path + '?fail=true', EXPIRED)
      expect(failed.status).toEqual(200)

      // Set by the failed request before it failed.
      expect(failed.headers.get('x-failed-request')).toBeNull()
      expect(failed.headers.getSetCookie()).toEqual([])

      // Set by a request hook and not stored with the route. A cache hit has
      // it too.
      expect(failed.headers.get('x-request-id')).toBeTruthy()
    },
  )

  test('sends the cookie stored with the stale route once', async () => {
    await request('/stale-if-error?cookie=true')
    const failed = await request('/stale-if-error?fail=true', EXPIRED)
    expect(failed.headers.getSetCookie()).toEqual(['cached=true; Path=/'])
  })

  test('responds normally if a non-fatal error was captured', async () => {
    const first = await request('/stale-if-error')
    const captured = await request('/stale-if-error?capture=true', EXPIRED)
    expect(captured.status).toEqual(200)
    expect(captured.body).not.toEqual(first.body)
  })
})
