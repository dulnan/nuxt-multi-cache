import { describe, expect, test, vi } from 'vitest'
import { isAppRequest } from '../../src/runtime/composables/useCacheAwareFetchInterceptor'

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
