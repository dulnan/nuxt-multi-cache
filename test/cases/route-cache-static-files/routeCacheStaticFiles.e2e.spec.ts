import path from 'node:path'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

/**
 * Get the route cache keys that were looked up since the last call.
 *
 * POST requests never use the route cache, so this request isn't looked up
 * itself.
 */
function getStorageLookups(): Promise<string[]> {
  return $fetch<string[]>('/api/storage-lookups', { method: 'POST' })
}

describe('The route cache', () => {
  test.each([
    ['/products', ['products']],
    ['/logo.svg', []],
    ['/logo.svg?v=2', []],
  ])('looks up %s: %j', async (path, expected) => {
    await getStorageLookups()

    const response = await fetch(path)
    expect(response.status).toEqual(200)

    expect(await getStorageLookups()).toEqual(expected)
  })
})
