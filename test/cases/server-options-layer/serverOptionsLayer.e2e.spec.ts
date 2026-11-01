import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import getRouteCacheItems from './../../__helpers__/getRouteCacheItems'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('A server options file in a layer', () => {
  test('is used by the app that extends the layer', async () => {
    await fetch('/about')

    // The key has the prefix from the server options of the layer.
    const keys = (await getRouteCacheItems())
      .map((row) => row.key)
      .filter((key) => key.includes('about'))
    expect(keys).toEqual(['from-layer--:about'])
  })
})
