import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import purgeAll from '~/test/__helpers__/purgeAll'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '~/src/runtime/helpers/constants'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

async function request(mode: string, date: Date) {
  const response = await fetch(`/swr?mode=${mode}`, {
    headers: {
      [TEST_MODE_DATE_OVERRIDE_HEADER]: date.toISOString(),
    },
  })
  return { status: response.status, body: await response.text() }
}

describe('A route with stale-while-revalidate', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('is revalidated once it is expired', async () => {
    const now = new Date()
    const first = await request('ok', now)

    // Still valid: Served from cache.
    expect((await request('ok', now)).body).toEqual(first.body)

    // Expired: The route is revalidated and the new response is stored.
    const later = new Date(now.getTime() + 120_000)
    const second = await request('ok', later)
    expect(second.body).not.toEqual(first.body)
    expect((await request('ok', later)).body).toEqual(second.body)
  })

  test.each(['not-found', 'uncacheable', 'empty'])(
    'is no longer served stale if the revalidation is not stored (%s)',
    async (mode) => {
      const now = new Date()
      const first = await request('ok', now)
      expect(first.status).toEqual(200)

      // Expired: The route is revalidated, but the response is not stored.
      const later = new Date(now.getTime() + 120_000)
      expect((await request(mode, later)).body).not.toEqual(first.body)

      // The revalidation is over, so the stale route must not be served.
      expect((await request(mode, later)).body).not.toEqual(first.body)
    },
  )
})
