import { beforeEach, beforeAll, describe, expect, test, vi } from 'vitest'
import cacheContextHandler from './../../src/runtime/serverHandler/cacheContext'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

vi.mock('#multi-cache-server-options', () => {
  return {
    default: {
      enabledForRequest: (event: any) => {
        return Promise.resolve(!!event.__ENABLED_FOR_REQUEST)
      },
    },
  }
})

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        component: true,
      },
    }
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
})
