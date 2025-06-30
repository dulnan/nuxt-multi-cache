import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
import getRouteCacheItems from '~/test/__helpers__/getRouteCacheItems'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The useCacheAwareFetchInterceptor', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('merges CDN headers', async () => {
    const response = await fetch('/cdn-headers')
    expect(
      response.headers.get('surrogate-control'),
      'The lower value wins, which is coming from the API route',
    ).toEqual('max-age=3600')

    expect(
      response.headers.get('cache-tag'),
      'Both cache tags from the API route and the page are present',
    ).toMatchInlineSnapshot(`"cdn-cache-tag-from-api cdn-cache-tag-from-page"`)
  })

  test('merges route cache cacheability', async () => {
    await fetch('/route-cache')

    const rows = await getRouteCacheItems()
    expect(
      rows.length,
      'Should have cached both the API route and the page',
    ).toEqual(2)

    const itemApi = rows.find((v) => v.key === 'api:handler-with-route')!.item
    expect(itemApi).toBeTruthy()
    expect(
      [...itemApi.cacheTags!],
      'Contains the cache tag from the API route only.',
    ).toMatchInlineSnapshot(`
      [
        "route-cache-tag-from-api",
      ]
    `)

    const itemPage = rows.find((v) => v.key === 'route-cache')!.item
    expect(itemPage).toBeTruthy()
    expect(
      [...itemPage.cacheTags!].sort(),
      'Contains the cache tag from the API route and the page.',
    ).toMatchInlineSnapshot(`
      [
        "route-cache-tag-from-api",
        "tag-from-page",
      ]
    `)
  })

  test('merges both route cache cacheability and CDN headers', async () => {
    const response = await fetch('/route-and-cdn')

    expect(
      response.headers.get('surrogate-control'),
      'The lower value wins, which is coming from the API route',
    ).toEqual('max-age=3600')

    const rows = await getRouteCacheItems()
    expect(
      rows.length,
      'Should have cached both the API route and the page',
    ).toEqual(2)

    const itemApi = rows.find(
      (v) => v.key === 'api:handler-with-cdn-and-route',
    )!.item
    expect(itemApi).toBeTruthy()
    expect(
      [...itemApi.cacheTags!],
      'Contains the cache tag from the API route only.',
    ).toMatchInlineSnapshot(`
        [
          "route-cache-tag-from-api",
        ]
      `)

    const itemPage = rows.find((v) => v.key === 'route-and-cdn')!.item
    expect(itemPage).toBeTruthy()
    expect(
      [...itemPage.cacheTags!].sort(),
      'Contains the cache tag from the API route and the page.',
    ).toMatchInlineSnapshot(`
      [
        "route-cache-tag-from-api",
        "tag-from-page",
      ]
    `)

    const responseCached = await fetch('/route-and-cdn')

    expect(
      responseCached.headers.get('surrogate-control'),
      'The header should still be present, even when served from route cache.',
    ).toEqual('max-age=3600')

    expect(
      responseCached.headers.get('cache-tag'),
      'The cache tags should still be present, event when served from route cache.',
    ).toMatchInlineSnapshot(`"cdn-cache-tag-from-api cdn-tag-from-page"`)
  })
})
