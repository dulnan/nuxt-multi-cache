import { describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { loadCacheContext } from './../../../src/runtime/serverHandler/helpers/storage'

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        component: true,
        data: true,
        route: true,
      },
    }
  }
})

vi.mock('#multi-cache-server-options', () => {
  return {
    default: {},
  }
})

describe('loadCacheContext helper', () => {
  test('Initializes storage only once', () => {
    const result1 = loadCacheContext()
    const result2 = loadCacheContext()
    expect(result1).toEqual(result2)
  })

  test('Initializes storages correctly', () => {
    const cacheContext = loadCacheContext()

    expect(cacheContext.component).toBeDefined()
    expect(cacheContext.data).toBeDefined()
    expect(cacheContext.route).toBeDefined()
  })
})
