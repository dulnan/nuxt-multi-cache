import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'

const multiCache: ModuleOptions = {
  route: {
    enabled: true,
    cacheStatus: true,
    statusCodes: [200, 301],
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

async function request(url: string) {
  const response = await fetch(url, { redirect: 'manual' })
  return {
    status: response.status,
    location: response.headers.get('location'),
    cacheStatus: response.headers.get('cache-status'),
  }
}

async function requestTwice(url: string) {
  const first = await request(url)
  const second = await request(url)
  return [first, second] as const
}

describe('The route.statusCodes option', () => {
  test('stores and serves a redirect with a listed status code', async () => {
    await purgeAll()

    const [first, second] = await requestTwice('/cachedRedirect/301')

    expect(first.status).toBe(301)
    expect(first.location).toMatch(/^\/\?random=\d+$/)
    expect(first.cacheStatus).toContain('fwd=uri-miss')
    expect(first.cacheStatus).toContain('stored')
    expect(second.status).toBe(301)
    expect(second.cacheStatus).toContain('hit')
    expect(second.location).toBe(first.location)
  })

  test('does not store a redirect with another status code', async () => {
    await purgeAll()

    const [first, second] = await requestTwice('/cachedRedirect/302')

    expect(first.status).toBe(302)
    expect(second.status).toBe(302)
    expect(second.cacheStatus).toContain('fwd=uri-miss')
    expect(second.location).not.toBe(first.location)
  })

  // The redirect has the cache key of its target, which would then be
  // redirected to itself.
  test.each([
    ['only removes the query', '/cachedRedirect/canonical?utm=newsletter'],
    ['only removes the trailing slash', '/cachedRedirect/canonical/'],
  ])('does not store a redirect that %s', async (_label, url) => {
    await purgeAll()

    const redirect = await request(url)
    const target = await request('/cachedRedirect/canonical')

    expect(redirect.status).toBe(301)
    expect(redirect.location).toBe('/cachedRedirect/canonical')
    expect(target).toEqual({
      status: 200,
      location: null,
      cacheStatus: expect.stringContaining('fwd=uri-miss'),
    })
    expect(redirect.cacheStatus).not.toContain('stored')
  })
})
