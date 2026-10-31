import { describe, expect, test, vi } from 'vitest'
import {
  addPrivateDirective,
  onBeforeResponse,
} from '../../../../src/runtime/server/hooks/beforeResponse'

const mocks = vi.hoisted(() => {
  return {
    cdnCacheControlHeader: 'Surrogate-Control',
  }
})

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get cdnCacheControlHeader() {
      return mocks.cdnCacheControlHeader
    },
  }
})

function buildEvent(headers: Record<string, string>): any {
  const responseHeaders: Record<string, string> = {}
  for (const [name, value] of Object.entries(headers)) {
    responseHeaders[name.toLowerCase()] = value
  }
  return {
    node: {
      res: {
        headers: responseHeaders,
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value
        },
      },
    },
  }
}

describe('addPrivateDirective', () => {
  test.each([
    [undefined, 'private'],
    ['', 'private'],
    ['max-age=60', 'private, max-age=60'],
    ['public, max-age=60', 'private, max-age=60'],
    ['PUBLIC, max-age=60', 'private, max-age=60'],
    ['private', 'private'],
    ['private="set-cookie", max-age=60', 'private, max-age=60'],
    ['no-store', 'private, no-store'],
    ['public, s-maxage=3600', 'private, s-maxage=3600'],
    [
      'no-cache="set-cookie, foo", public',
      'private, no-cache="set-cookie, foo"',
    ],
  ])('%s => %s', (value, expected) => {
    expect(addPrivateDirective(value)).toEqual(expected)
  })
})

describe('onBeforeResponse', () => {
  test.each([
    ['max-age=0, no-store', 'public, max-age=60', 'private, max-age=60'],
    ['max-age=3600, private', undefined, 'private'],
    ['max-age=3600, public', 'public, max-age=60', 'public, max-age=60'],
  ])(
    'with CDN header %s, changes Cache-Control from %s to %s',
    (cdn, cacheControl, expected) => {
      const event = buildEvent({
        'surrogate-control': cdn,
        ...(cacheControl ? { 'cache-control': cacheControl } : {}),
      })
      onBeforeResponse(event)
      expect(event.node.res.headers['cache-control']).toEqual(expected)
    },
  )

  test('does nothing without a CDN header', () => {
    const event = buildEvent({ 'cache-control': 'public, max-age=60' })
    onBeforeResponse(event)
    expect(event.node.res.headers['cache-control']).toEqual(
      'public, max-age=60',
    )
  })

  test('does nothing if the CDN header is Cache-Control', () => {
    mocks.cdnCacheControlHeader = 'Cache-Control'
    const event = buildEvent({ 'cache-control': 'public, no-store' })
    onBeforeResponse(event)
    expect(event.node.res.headers['cache-control']).toEqual('public, no-store')
    mocks.cdnCacheControlHeader = 'Surrogate-Control'
  })
})
