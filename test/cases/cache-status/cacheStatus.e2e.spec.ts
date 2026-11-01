import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import purgeAll from '~/test/__helpers__/purgeAll'
import getRouteCacheItems from '~/test/__helpers__/getRouteCacheItems'
import { sleep } from '~/test/__helpers__'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '~/src/runtime/helpers/constants'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

const NOW = new Date('2026-01-01T12:00:00.000Z')

function later(seconds: number): Date {
  return new Date(NOW.getTime() + seconds * 1000)
}

async function getCacheStatus(
  url: string,
  options: {
    date?: Date
    method?: string
    headers?: Record<string, string>
  } = {},
) {
  const response = await fetch(url, {
    method: options.method,
    headers: {
      [TEST_MODE_DATE_OVERRIDE_HEADER]: (options.date ?? NOW).toISOString(),
      ...options.headers,
    },
  })
  return response.headers.get('cache-status')
}

describe('The Cache-Status header of the route cache', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('is a stored miss, then a hit with the remaining time to live', async () => {
    expect(await getCacheStatus('/cached')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss; ttl=3600; stored',
    )
    expect(await getCacheStatus('/cached')).toEqual(
      'nuxt-multi-cache; hit; ttl=3600',
    )
    expect(await getCacheStatus('/cached', { date: later(600) })).toEqual(
      'nuxt-multi-cache; hit; ttl=3000',
    )
  })

  test('has no ttl for items without a max age', async () => {
    expect(await getCacheStatus('/permanent')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss; stored',
    )
    expect(await getCacheStatus('/permanent')).toEqual('nuxt-multi-cache; hit')
  })

  test('works for HEAD requests', async () => {
    expect(await getCacheStatus('/cached', { method: 'HEAD' })).toEqual(
      'nuxt-multi-cache; fwd=uri-miss; ttl=3600; stored',
    )
    expect(await getCacheStatus('/cached', { method: 'HEAD' })).toEqual(
      'nuxt-multi-cache; hit; ttl=3600',
    )
  })

  test('is "miss" if the stored item can not be read, and stores it again', async () => {
    await fetch('/corrupt-item?key=cached', { method: 'POST' })
    expect(await getCacheStatus('/cached')).toEqual(
      'nuxt-multi-cache; fwd=miss; ttl=3600; stored',
    )
    expect(await getCacheStatus('/cached')).toEqual(
      'nuxt-multi-cache; hit; ttl=3600',
    )
  })

  test('is a miss without "stored" if the body can not be stored', async () => {
    expect(await getCacheStatus('/web-response')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss',
    )
    expect(await getCacheStatus('/web-response')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss',
    )
  })

  test('works for rendered Nuxt pages', async () => {
    expect(await getCacheStatus('/page')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss; ttl=3600; stored',
    )
    expect(await getCacheStatus('/page')).toEqual(
      'nuxt-multi-cache; hit; ttl=3600',
    )
  })

  test('is a miss without "stored" if the response is not cacheable', async () => {
    expect(await getCacheStatus('/cached?mode=uncacheable')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss',
    )
    expect(await getCacheStatus('/cached?mode=uncacheable')).toEqual(
      'nuxt-multi-cache; fwd=uri-miss',
    )
  })

  test('is "stale" if the stored item is expired', async () => {
    await getCacheStatus('/cached')
    expect(await getCacheStatus('/cached', { date: later(3700) })).toEqual(
      'nuxt-multi-cache; fwd=stale; ttl=3600; stored',
    )
  })

  test('is a stale hit while another request revalidates the route', async () => {
    await getCacheStatus('/swr')

    // Expired: This request revalidates the route, which takes a second.
    const revalidating = getCacheStatus('/swr?delay=1000', {
      date: later(120),
    })
    await sleep(300)

    // The stale route is served, expired for 60 seconds.
    expect(await getCacheStatus('/swr', { date: later(120) })).toEqual(
      'nuxt-multi-cache; hit; ttl=-60',
    )
    expect(await revalidating).toEqual(
      'nuxt-multi-cache; fwd=stale; ttl=60; stored',
    )
  })

  test('has the status of the error if a stale route is served instead', async () => {
    await getCacheStatus('/stale-if-error')
    expect(
      await getCacheStatus('/stale-if-error?fail=true', { date: later(120) }),
    ).toEqual('nuxt-multi-cache; fwd=stale; fwd-status=503; ttl=-60')
  })

  // For HTML, Nuxt renders its error page with an internal request and copies
  // its headers onto the error response.
  test.each(['text/html', 'application/json'])(
    'is the status of the page for error responses (%s)',
    async (accept) => {
      const response = await fetch('/does-not-exist', { headers: { accept } })
      expect(response.status).toEqual(404)
      expect(response.headers.get('cache-status')).toEqual(
        'nuxt-multi-cache; fwd=uri-miss',
      )
    },
  )

  test('is "bypass" if enabledForRequest returns false', async () => {
    expect(
      await getCacheStatus('/cached', { headers: { 'x-skip-cache': 'true' } }),
    ).toEqual('nuxt-multi-cache; fwd=bypass')
  })

  test('is "bypass" for paths the route cache does not apply to', async () => {
    expect(await getCacheStatus('/styles.css')).toEqual(
      'nuxt-multi-cache; fwd=bypass',
    )
  })

  test('is "method" for methods other than GET and HEAD', async () => {
    expect(await getCacheStatus('/cached', { method: 'POST' })).toEqual(
      'nuxt-multi-cache; fwd=method',
    )
  })

  test('is not stored with the route', async () => {
    await getCacheStatus('/cached')
    const items = await getRouteCacheItems()
    const item = items.find((v) => v.key === 'cached')!.item
    expect(item.headers['cache-status']).toBeUndefined()
  })

  test('comes after the entries of caches closer to the origin', async () => {
    expect(await getCacheStatus('/upstream')).toEqual(
      'upstream-cache; hit, nuxt-multi-cache; fwd=uri-miss; stored',
    )
    expect(await getCacheStatus('/upstream')).toEqual(
      'upstream-cache; hit, nuxt-multi-cache; hit',
    )

    // Only the entry of the upstream cache is stored.
    const items = await getRouteCacheItems()
    const item = items.find((v) => v.key === 'upstream')!.item
    expect(item.headers['cache-status']).toEqual('upstream-cache; hit')
  })

  test('keeps entries set after a non-fatal error was captured', async () => {
    expect(await getCacheStatus('/captured-error')).toEqual(
      'upstream-cache; hit, nuxt-multi-cache; fwd=uri-miss; stored',
    )

    const items = await getRouteCacheItems()
    const item = items.find((v) => v.key === 'captured-error')!.item
    expect(item.headers['cache-status']).toEqual('upstream-cache; hit')
  })
})
