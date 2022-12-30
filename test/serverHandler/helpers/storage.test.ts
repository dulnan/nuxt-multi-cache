import { describe, expect, test, vi } from 'vitest'

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {},
      }
    },
  }
})

vi.mock('@nuxt/kit')

describe('loadCacheContext helper', () => {
  test('Initializes storage only once', async () => {
    const { loadCacheContext } = await import(
      './../../../src/runtime/serverHandler/helpers/storage'
    )
    const kit = await import('@nuxt/kit')
    kit.loadNuxtConfig = vi.fn().mockReturnValueOnce(
      Promise.resolve({
        multiCache: {
          component: {
            enabled: true,
          },
          data: {
            enabled: true,
          },
          route: {
            enabled: true,
          },
        },
      }),
    )
    const promise1 = loadCacheContext()
    const promise2 = loadCacheContext()
    expect(promise1).toEqual(promise2)
  })

  test('Initializes storages correctly', async () => {
    const { loadCacheContext } = await import(
      './../../../src/runtime/serverHandler/helpers/storage'
    )
    const kit = await import('@nuxt/kit')
    kit.loadNuxtConfig = vi.fn().mockReturnValueOnce(
      Promise.resolve({
        multiCache: {
          component: {
            enabled: true,
          },
          data: {
            enabled: true,
          },
          route: {
            enabled: true,
          },
        },
      }),
    )
    const cacheContext = await loadCacheContext()

    expect(cacheContext.component).toBeDefined()
    expect(cacheContext.data).toBeDefined()
    expect(cacheContext.route).toBeDefined()
  })
})
