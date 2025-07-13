import path from 'node:path'
import { setup, createPage, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The route cache with h3-fast-compression', () => {
  test('Caches a compressed route', async () => {
    // Should put it in cache, because the page itself is cacheable.
    const page = await createPage('/')

    // The value.
    const dataA = await page.locator('#current-time').innerText()

    // Reload the page. It should be served from cache, even if the API call
    // it's doing is uncacheable.
    await page.reload()
    const dataB = await page.locator('#current-time').innerText()

    // Assert that it has actually cached the page.
    expect(dataB).toEqual(dataA)
  })

  test('Compresses an uncached and cached response', async () => {
    const first = await fetch('/', {
      method: 'get',
      headers: {
        'accept-encoding': 'br',
      },
    })
    expect(first.headers.get('content-encoding')).toEqual('br')

    const second = await fetch('/', {
      method: 'get',
      headers: {
        'accept-encoding': 'br',
      },
    })
    expect(second.headers.get('content-encoding')).toEqual('br')
  })
})
