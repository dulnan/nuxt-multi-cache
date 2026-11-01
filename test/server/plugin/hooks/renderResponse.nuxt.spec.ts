import { describe, expect, test, vi, beforeEach } from 'vitest'
import { onRenderResponse } from '../../../../src/runtime/server/hooks/renderResponse'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'
import type { RouteCacheItem } from '~/src/runtime/types'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const now = toTimestamp(mockDate)

const mocks = vi.hoisted(() => {
  return {
    setCachedResponse: vi.fn(),
  }
})

vi.mock('../../../../src/runtime/helpers/routeCache', () => {
  return {
    setCachedResponse: mocks.setCachedResponse,
  }
})

function buildEvent(staleIfErrorExpires: number | undefined, tags: string[]) {
  const decoded: Partial<RouteCacheItem> = {
    data: '<html>Stale</html>',
    headers: { 'content-type': 'text/html' },
    statusCode: 200,
    // The item itself is expired.
    expires: now - 10,
    staleIfErrorExpires,
    cacheTags: [],
  }

  return {
    context: {
      nitro: {
        errors: [{ error: new Error('Failed'), context: { tags } }],
      },
      multiCache: {
        requestTimestamp: now,
        routeCachedDecoded: decoded,
      } as Record<string, any>,
    },
    node: {
      res: {
        statusMessage: '',
      },
    },
  }
}

function buildResponse(statusCode: number) {
  return {
    body: '<html>Error page</html>',
    statusCode,
    statusMessage: 'Server Error',
    headers: { 'content-type': 'text/html;charset=utf-8' },
  }
}

function render(
  response: ReturnType<typeof buildResponse>,
  event: ReturnType<typeof buildEvent>,
) {
  onRenderResponse(response, { event, render: vi.fn() } as any)
}

describe('render:response nitro hook handler', () => {
  beforeEach(() => {
    mocks.setCachedResponse.mockReset()
  })

  test('Replaces the error page of a failed render with the stale route', () => {
    const event = buildEvent(now + 60, ['ssr'])
    const response = buildResponse(500)

    render(response, event)

    expect(mocks.setCachedResponse).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      body: '<html>Stale</html>',
      statusCode: 200,
      statusMessage: undefined,
      headers: { 'content-type': 'text/html' },
    })
    expect(event.context.multiCache.routeCacheStatus).toEqual({
      fwd: 'stale',
      fwdStatus: 500,
      ttl: -10,
    })
  })

  test.each([
    ['the render did not fail', now + 60, ['test'], 500],
    ['the status is not a server error', now + 60, ['ssr'], 404],
    ['stale-if-error is expired', now - 1, ['ssr'], 500],
    ['stale-if-error is missing', undefined, ['ssr'], 500],
  ])(
    'Keeps the response if %s',
    (_label, staleIfErrorExpires, tags, statusCode) => {
      const event = buildEvent(staleIfErrorExpires, tags)
      const response = buildResponse(statusCode)

      render(response, event)

      expect(mocks.setCachedResponse).not.toHaveBeenCalled()
      expect(response).toEqual(buildResponse(statusCode))
    },
  )
})
