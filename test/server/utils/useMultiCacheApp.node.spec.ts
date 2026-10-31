import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import {
  getMultiCacheApp,
  useMultiCacheApp,
} from '../../../src/runtime/server/utils/useMultiCacheApp'
import type { MultiCacheApp } from '../../../src/runtime/types'

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
  }
})

describe('useMultiCacheApp', () => {
  test('Returns undefined if the server plugin is not registered.', () => {
    mocks.useNitroApp.mockReturnValue({})
    expect(useMultiCacheApp()).toBeUndefined()
    expectTypeOf(useMultiCacheApp).returns.toEqualTypeOf<
      MultiCacheApp | undefined
    >()
  })

  test('Returns the app.', () => {
    const app = { cache: {} }
    mocks.useNitroApp.mockReturnValue({ multiCache: app })
    expect(useMultiCacheApp()).toBe(app)
  })
})

describe('getMultiCacheApp', () => {
  test('Throws an error if the server plugin is not registered.', () => {
    mocks.useNitroApp.mockReturnValue({})
    expect(() => getMultiCacheApp()).toThrow(
      'Failed to get nuxt-multi-cache app.',
    )
  })

  test('Returns the app.', () => {
    const app = { cache: {} }
    mocks.useNitroApp.mockReturnValue({ multiCache: app })
    expect(getMultiCacheApp()).toBe(app)
  })
})
