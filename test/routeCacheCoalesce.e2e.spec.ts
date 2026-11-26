import path from 'node:path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'

const multiCache: ModuleOptions = {
  route: {
    enabled: true,
    coalesce: true,
  },
  api: {
    enabled: true,
    authorization: false,
  },
}
await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig: { multiCache } as any,
})

function fetchConcurrently<T>(url: string, count: number): Promise<T[]> {
  return Promise.all(Array.from({ length: count }, () => $fetch<T>(url)))
}

describe('Coalescing in the route cache', () => {
  test('renders a route once for concurrent requests', async () => {
    await purgeAll()

    const responses = await fetchConcurrently<{ render: number }>(
      '/api/coalesce',
      5,
    )

    expect(new Set(responses.map((response) => response.render)).size).toBe(1)
  })

  test('renders an uncacheable route in parallel after one render', async () => {
    type Render = { startedAt: number; endedAt: number }

    // Each render takes 500 ms.
    const responses = await fetchConcurrently<Render>(
      '/api/coalesceUncacheable',
      10,
    )
    const [first, ...others] = responses.sort(
      (a, b) => a.startedAt - b.startedAt,
    )

    // The other requests waited for the first render, then rendered the route
    // at the same time, instead of one after another.
    const othersStarted = Math.max(...others.map((r) => r.startedAt))
    const othersEnded = Math.min(...others.map((r) => r.endedAt))
    expect(othersStarted).toBeLessThan(othersEnded)
    const allEnded = Math.max(...responses.map((r) => r.endedAt))
    expect(allEnded - first!.startedAt).toBeLessThan(1_500)
  })
})
