import { describe, expect, test, vi, beforeEach } from 'vitest'
import { createError } from 'h3'
import { onError } from '../../../../src/runtime/server/hooks/error'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'
import type { RouteCacheItem } from '~/src/runtime/types'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const now = toTimestamp(mockDate)

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
    sendWebResponse: vi.fn(),
    setCachedResponse: vi.fn(),
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
  }
})

vi.mock('h3', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('h3')>()),
    sendWebResponse: mocks.sendWebResponse,
  }
})

vi.mock('../../../../src/runtime/helpers/routeCache', () => {
  return {
    setCachedResponse: mocks.setCachedResponse,
  }
})

function buildEvent(staleIfErrorExpires: number | undefined) {
  const decoded: Partial<RouteCacheItem> = {
    data: '<html></html>',
    headers: {},
    statusCode: 200,
    // The item itself is expired.
    expires: now - 10,
    staleIfErrorExpires,
    cacheTags: [],
  }

  return {
    context: {
      multiCache: {
        requestTimestamp: now,
        routeCachedDecoded: decoded,
      },
    },
    node: {
      res: {
        // Set by h3 from the error before the hook is called.
        statusMessage: 'Backend not available.',
      },
    },
  }
}

describe('error nitro hook handler', () => {
  beforeEach(() => {
    mocks.useNitroApp.mockReturnValue({
      multiCache: {
        state: {
          removeKeyBeingRevalidated: vi.fn(),
        },
      },
    })
    mocks.sendWebResponse.mockReset()
    mocks.setCachedResponse.mockReset()
  })

  test.each([
    ['permanent', -1, true],
    ['not yet expired', now + 60, true],
    ['expired', now - 1, false],
    ['never', 0, false],
    ['missing', undefined, false],
  ])(
    'Serves a stale route if stale-if-error is %s',
    (_label, staleIfErrorExpires, served) => {
      const event = buildEvent(staleIfErrorExpires)

      onError(new Error('Failed to render.'), { event } as any)

      expect(mocks.sendWebResponse).toHaveBeenCalledTimes(served ? 1 : 0)
      expect(mocks.setCachedResponse).toHaveBeenCalledTimes(served ? 1 : 0)
    },
  )

  test.each([
    ['an unhandled error', true, new Error('Failed to render.')],
    ['a 500 error', true, createError({ statusCode: 500 })],
    ['a 503 error', true, createError({ statusCode: 503 })],
    ['a 404 error', false, createError({ statusCode: 404 })],
    ['a 401 error', false, createError({ statusCode: 401 })],
  ])('Serves a stale route for %s: %s', (_label, served, error) => {
    const event = buildEvent(now + 60)

    onError(error, { event } as any)

    expect(mocks.sendWebResponse).toHaveBeenCalledTimes(served ? 1 : 0)
  })

  test('Resets the status text of the error response', () => {
    const event = buildEvent(now + 60)

    onError(createError({ statusCode: 500 }), { event } as any)

    expect(mocks.sendWebResponse).toHaveBeenCalledTimes(1)
    expect(event.node.res.statusMessage).toEqual('')
  })
})
