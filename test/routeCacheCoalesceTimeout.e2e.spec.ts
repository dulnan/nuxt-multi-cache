import path from 'node:path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'

const multiCache: ModuleOptions = {
  route: {
    enabled: true,
    // Shorter than the render of the route, which takes 500 ms.
    coalesce: 100,
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

describe('Coalescing with a timeout', () => {
  test('renders the route after waiting for the timeout', async () => {
    await purgeAll()

    const responses = await Promise.all([
      $fetch<{ render: number }>('/api/coalesce'),
      $fetch<{ render: number }>('/api/coalesce'),
    ])
    const renders = new Set(responses.map((response) => response.render))

    expect(renders.size).toBe(2)
  })
})
