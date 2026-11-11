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
})
