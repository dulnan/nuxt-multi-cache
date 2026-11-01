import { describe, expect, test, vi, beforeEach } from 'vitest'
import { createError, type H3Error } from 'h3'
import errorHandler from '../../../src/runtime/server/handler/errorHandler'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'
import type { RouteCacheItem } from '~/src/runtime/types'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const now = toTimestamp(mockDate)

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
    sendWebResponse: vi.fn(),
    setCachedResponse: vi.fn(),
    removeKeyBeingRevalidated: vi.fn(),
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
    defineNitroErrorHandler: (handler: unknown) => handler,
  }
})

vi.mock('h3', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('h3')>()),
    sendWebResponse: mocks.sendWebResponse,
  }
})

vi.mock('../../../src/runtime/helpers/routeCache', () => {
  return {
    setCachedResponse: mocks.setCachedResponse,
  }
})

function buildEvent(
  staleIfErrorExpires: number | undefined,
  multiCache: Record<string, unknown> = {},
) {
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
    handled: false,
    context: {
      multiCache: {
        requestTimestamp: now,
        routeCachedDecoded: decoded,
        ...multiCache,
      },
    },
    node: {
      res: {
        // Set by h3 from the error before the error handler is called.
        statusMessage: 'Backend not available.',
      },
    },
  }
}

function mockApp(routeCacheStatus = '') {
  mocks.useNitroApp.mockReturnValue({
    multiCache: {
      config: {
        routeCacheStatus,
      },
      state: {
        removeKeyBeingRevalidated: mocks.removeKeyBeingRevalidated,
      },
    },
  })
}

function handle(error: H3Error, event: ReturnType<typeof buildEvent>) {
  return errorHandler(error, event as any, { defaultHandler: vi.fn() as any })
}

describe('Nitro error handler', () => {
  beforeEach(() => {
    mockApp()
    mocks.sendWebResponse.mockReset()
    mocks.setCachedResponse.mockReset()
    mocks.removeKeyBeingRevalidated.mockReset()
  })

  test.each([
    ['permanent', -1, true],
    ['not yet expired', now + 60, true],
    ['expired', now - 1, false],
    ['never', 0, false],
    ['missing', undefined, false],
  ])(
    'Serves a stale route if stale-if-error is %s',
    async (_label, staleIfErrorExpires, served) => {
      const event = buildEvent(staleIfErrorExpires)

      await handle(createError({ statusCode: 500 }), event)

      expect(mocks.sendWebResponse).toHaveBeenCalledTimes(served ? 1 : 0)
      expect(mocks.setCachedResponse).toHaveBeenCalledTimes(served ? 1 : 0)
    },
  )

  test.each([
    // h3 converts unhandled errors to H3Errors with a status code of 500.
    ['an unhandled error', true, createError(new Error('Failed to render.'))],
    ['a 500 error', true, createError({ statusCode: 500 })],
    ['a 503 error', true, createError({ statusCode: 503 })],
    ['a 404 error', false, createError({ statusCode: 404 })],
    ['a 401 error', false, createError({ statusCode: 401 })],
  ])('Serves a stale route for %s: %s', async (_label, served, error) => {
    const event = buildEvent(now + 60)

    await handle(error, event)

    expect(mocks.sendWebResponse).toHaveBeenCalledTimes(served ? 1 : 0)
  })

  test('Resolves once the stale route has been sent', async () => {
    const event = buildEvent(now + 60)
    let sent = false
    mocks.sendWebResponse.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      sent = true
    })

    await handle(createError({ statusCode: 500 }), event)

    // Nitro calls the next error handler (Nuxt's) if the response hasn't been
    // sent when the promise resolves.
    expect(sent).toEqual(true)
  })

  test('Does not respond if the response has already been sent', async () => {
    const event = buildEvent(now + 60)
    event.handled = true

    await handle(createError({ statusCode: 500 }), event)

    expect(mocks.sendWebResponse).not.toHaveBeenCalled()
  })

  test.each([
    ['a stale route is served', now + 60],
    ['no stale route is served', undefined],
  ])(
    'Removes the revalidation key if %s',
    async (_label, staleIfErrorExpires) => {
      const event = buildEvent(staleIfErrorExpires, {
        routeRevalidationkey: '/foobar',
      })

      await handle(createError({ statusCode: 500 }), event)

      expect(mocks.removeKeyBeingRevalidated).toHaveBeenCalledWith('/foobar')
    },
  )

  test('Resets the status text of the error response', async () => {
    const event = buildEvent(now + 60)

    await handle(createError({ statusCode: 500 }), event)

    expect(mocks.sendWebResponse).toHaveBeenCalledTimes(1)
    expect(event.node.res.statusMessage).toEqual('')
  })

  test('Adds the Cache-Status header to the stale route', async () => {
    mockApp('nuxt-multi-cache')
    const event = buildEvent(now + 60)

    await handle(createError({ statusCode: 500 }), event)

    const response: Response = mocks.sendWebResponse.mock.calls[0]![1]
    expect(response.headers.get('cache-status')).toEqual(
      'nuxt-multi-cache; fwd=stale; fwd-status=500; ttl=-10',
    )
  })
})
