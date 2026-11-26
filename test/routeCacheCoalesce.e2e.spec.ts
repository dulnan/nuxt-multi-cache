import path from 'node:path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'

const multiCache: ModuleOptions = {
  route: {
    enabled: true,
    coalesce: true,
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

describe('Coalescing in the route cache', () => {
  test('Renders a route once for concurrent requests.', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        $fetch<{ data: number }>('/api/slowApiRequest?slow=true'),
      ),
    )
    expect(new Set(responses.map((v) => v.data)).size).toBe(1)
  })
})
