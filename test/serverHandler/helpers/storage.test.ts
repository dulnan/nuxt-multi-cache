import { describe, expect, test, vi } from 'vitest'

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {
          component: true,
          data: true,
          route: true,
        },
      }
    },
  }
})

vi.mock('#multi-cache-server-options', () => {
  return {
    default: {},
  }
})

describe('loadCacheContext helper', () => {
  test('Initializes storage only once', async () => {
    const { loadCacheContext } = await import(
      './../../../src/runtime/serverHandler/helpers/storage'
    )
    const result1 = loadCacheContext()
    const result2 = loadCacheContext()
    expect(result1).toEqual(result2)
  })

  test('Initializes storages correctly', async () => {
    const { loadCacheContext } = await import(
      './../../../src/runtime/serverHandler/helpers/storage'
    )
    const cacheContext = loadCacheContext()

    expect(cacheContext.component).toBeDefined()
    expect(cacheContext.data).toBeDefined()
    expect(cacheContext.route).toBeDefined()
  })
})
