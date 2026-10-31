import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
import getRouteCacheItems from '~/test/__helpers__/getRouteCacheItems'
import purgeByKey from '~/test/__helpers__/purgeByKey'

await setup({
  server: true,
  browser: false,
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

  test('does not merge an s-maxage longer than the max age of the page', async () => {
    const response = await fetch('/cdn-shared-max-age')
    const control = response.headers.get('surrogate-control') ?? ''
    expect(control).toContain('max-age=0')
    expect(control).not.toContain('s-maxage=3600')
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

  test.each(['x', 'true'])(
    'merges route cache cacheability if the page request has the internal header: %s',
    async (value) => {
      // The page request's headers are forwarded to the API route request.
      await fetch('/route-cache', {
        headers: {
          'x-nuxt-multi-cache-request': value,
        },
      })

      const rows = await getRouteCacheItems()
      const itemPage = rows.find((v) => v.key === 'route-cache')!.item
      expect(itemPage.cacheTags).toContain('route-cache-tag-from-api')
    },
  )

  test('merges route cache cacheability of a retried API route request', async () => {
    // The API route fails on the first request, which ofetch retries.
    await fetch('/route-cache-retry')

    const rows = await getRouteCacheItems()
    const itemPage = rows.find((v) => v.key === 'route-cache-retry')!.item
    expect(itemPage.cacheTags).toContain('route-cache-tag-from-retry')
  })

  test('merges the route cache max age and stale-if-error of the API route', async () => {
    // The first request renders the API route, the second one serves it from
    // the route cache.
    for (const request of ['rendered', 'cached']) {
      await fetch('/route-cache-max-age')

      const rows = await getRouteCacheItems()
      const itemApi = rows.find(
        (v) => v.key === 'api:handler-with-route-max-age',
      )!.item
      const itemPage = rows.find((v) => v.key === 'route-cache-max-age')!.item

      expect(itemPage.expires, request).toEqual(itemApi.expires)
      expect(itemPage.staleIfErrorExpires, request).toEqual(
        itemApi.staleIfErrorExpires,
      )
      expect(itemPage.cacheTags, request).toContain('route-cache-tag-from-api')

      // So that the page is rendered again.
      await purgeByKey('route', 'route-cache-max-age')
    }
  })

  test.each(['uncacheable', 'uncacheable-data'])(
    'makes the route uncacheable if the API route is uncacheable: %s',
    async (name) => {
      // The page marks itself as cacheable, but the API route it fetches is
      // uncacheable, either directly or bubbled from the data cache.
      await fetch(`/route-cache-${name}`)

      const rows = await getRouteCacheItems()
      expect(rows.map((v) => v.key)).toEqual([])
    },
  )

  test('does not store or serve the internal headers of the API route', async () => {
    // The page fetches the API route as an internal request, which gets the
    // internal cache tags header.
    await fetch('/route-cache')

    const rows = await getRouteCacheItems()
    const itemApi = rows.find((v) => v.key === 'api:handler-with-route')!.item
    expect(Object.keys(itemApi.headers)).toEqual(['content-type'])

    // Served from cache to an external request.
    const response = await fetch('/api/handler-with-route')
    expect(response.headers.get('x-nuxt-multi-cache-cache-tags')).toBeNull()
  })

  test('adds no empty cache tag if the API route has no route cache tags', async () => {
    await fetch('/route-cache-api-without-tags')

    const rows = await getRouteCacheItems()
    const itemPage = rows.find(
      (v) => v.key === 'route-cache-api-without-tags',
    )!.item
    expect(itemPage.cacheTags).toEqual(['tag-from-page'])
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
