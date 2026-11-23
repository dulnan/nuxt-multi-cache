import type { FetchContext, FetchOptions } from 'ofetch'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { isAppRequest } from '../../src/runtime/composables/useCacheAwareFetchInterceptor'
import type { useCacheAwareFetchInterceptor } from '../../src/runtime/composables/useCacheAwareFetchInterceptor'

vi.mock('#imports', () => {
  return {
    useRequestEvent: vi.fn(),
    useRuntimeConfig: vi.fn(),
  }
})

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    isServer: true,
    debug: false,
    cdnEnabled: true,
    routeCacheEnabled: true,
  }
})

describe('isAppRequest', () => {
  test.each([
    ['/api/users', undefined, true],
    ['/api/users', '/', true],
    ['/api/users', '/base/', true],
    // Nitro only handles URLs starting with "/" itself.
    ['api/users', '/', false],
    ['api/users', undefined, false],
    ['/api/users', 'https://example.com', false],
    ['https://example.com/api/users', undefined, false],
    ['https://example.com/api/users', '/', false],
    ['//example.com/api/users', undefined, false],
    ['//example.com/api/users', '/', false],
  ])(
    'returns whether %s with base URL %s is handled by the app: %s',
    (request, baseURL, expected) => {
      expect(isAppRequest(request, baseURL)).toBe(expected)
    },
  )

  test('returns false for a Request object', () => {
    expect(isAppRequest(new Request('https://example.com/api/users'))).toBe(
      false,
    )
  })
})

describe('useCacheAwareFetchInterceptor types', () => {
  type Interceptor = ReturnType<typeof useCacheAwareFetchInterceptor>
  type OnResponseContext = Parameters<NonNullable<Interceptor['onResponse']>>[0]
  type Data = { items: string[] }

  test('can be used as hooks of a fetch with typed response data', () => {
    expectTypeOf<Interceptor['onRequest']>().toExtend<
      FetchOptions<'json', Data>['onRequest']
    >()
    expectTypeOf<Interceptor['onResponse']>().toExtend<
      FetchOptions<'json', Data>['onResponse']
    >()
  })

  test('can be called with a context without a response', () => {
    // E.g. from a hook typed with a plain FetchContext, like the onResponse of
    // the nuxt-graphql-middleware fetch options.
    expectTypeOf<FetchContext<Data>>().toExtend<OnResponseContext>()
  })
})
