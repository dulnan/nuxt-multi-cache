import { beforeEach, beforeAll, describe, expect, test, vi } from 'vitest'
import cacheContextHandler from './../../src/runtime/serverHandler/cacheContext'

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {},
      }
    },
  }
})

vi.mock('@nuxt/kit', () => {
  return {
    loadNuxtConfig: () => {
      return Promise.resolve({
        multiCache: {
          component: {
            enabled: true,
          },
          enabledForRequest: (event: any) => {
            return Promise.resolve(!!event.__ENABLED_FOR_REQUEST)
          },
        },
      })
    },
  }
})

describe('cacheContext server handler', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
  })
  beforeAll(() => {
    vi.resetModules()
  })
  test('Adds cache context to event', async () => {
    const event: any = {
      context: {},
      __ENABLED_FOR_REQUEST: true,
    }
    await cacheContextHandler(event)
    expect(event.context).toMatchSnapshot()
  })

  test('Does not add cache context to event if enabledForRequest returns false', async () => {
    const event: any = {
      context: {},
      __ENABLED_FOR_REQUEST: false,
    }
    await cacheContextHandler(event)
    expect(event.context).toEqual({})
  })

  test('Caches that there is no enabledForRequest method.', async () => {
    const event: any = {
      context: {},
    }
    const shouldAddCacheContext = await import(
      './../../src/runtime/serverHandler/cacheContext'
    ).then((v) => v.shouldAddCacheContext)

    const kit = await import('@nuxt/kit')
    kit.loadNuxtConfig = vi.fn().mockReturnValueOnce(
      Promise.resolve({
        multiCache: {},
      }),
    )
    expect(await shouldAddCacheContext(event)).toEqual(true)
    expect(await shouldAddCacheContext(event)).toEqual(true)
  })
})
