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

function fetchConcurrently(url: string): Promise<{ render: number }[]> {
  return Promise.all(
    Array.from({ length: 5 }, () => $fetch<{ render: number }>(url)),
  )
}

describe('Coalescing in the route cache', () => {
  test('renders a route once for concurrent requests', async () => {
    await purgeAll()

    const responses = await fetchConcurrently('/api/coalesce')
    const renders = new Set(responses.map((response) => response.render))

    expect(renders.size).toBe(1)
  })

  test('renders an uncacheable route for each request', async () => {
    await purgeAll()

    const responses = await fetchConcurrently('/api/coalesceUncacheable')
    const renders = new Set(responses.map((response) => response.render))

    // Nothing was stored, so no request gets the response of another.
    expect(renders.size).toBe(5)
  })
})
