import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, test, vi } from 'vitest'
import { logger } from '../../../src/runtime/helpers/logger'
import { createTestApp } from './__helpers__'

const { getIsServer, setIsServer } = vi.hoisted(() => {
  let serverValue = false

  return {
    getIsServer: vi.fn(() => serverValue),
    setIsServer: (value: boolean) => {
      serverValue = value
    },
  }
})

// Use the hoisted function in the mock
vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return getIsServer()
    },
    debug: true,
    cdnEnabled: true,
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

const mocks = vi.hoisted(() => {
  return {
    useNuxtApp: vi.fn(),
  }
})

vi.mock('#app', () => {
  return {
    useNuxtApp: mocks.useNuxtApp,
  }
})

vi.mock('vue', async () => {
  const vue: any = await vi.importActual('vue')
  return {
    ...vue,
    getCurrentInstance() {
      return undefined
    },
    useSSRContext() {
      return undefined
    },
  }
})

describe('RenderCacheable with missing context', () => {
  test('Bails if current instance could not be found.', async () => {
    setIsServer(true)

    const loggerSpy = vi.spyOn(logger, 'warn')

    const vue = await import('vue')
    vue.getCurrentInstance = vi.fn().mockReturnValue(null)
    vue.useSSRContext = vi.fn().mockReturnValue({ event: {} })

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })

    await renderToString(app, ssrContext)
    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to get current instance in RenderCacheable component.',
      {
        asyncDataKeys: ['examplePayload'],
        bubbleCacheability: false,
        cacheKey: 'foobar',
        cacheTags: ['test'],
        maxAge: undefined,
        noCache: false,
        staleIfError: undefined,
        tag: undefined,
      },
    )
  })

  test('Bails if SSR context could not be found', async () => {
    setIsServer(true)

    const loggerSpy = vi.spyOn(logger, 'warn')
    const vue = await import('vue')
    vue.getCurrentInstance = vi.fn().mockReturnValue({ parent: {}, type: {} })

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    mocks.useNuxtApp.mockImplementation(() => {
      return {
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })

    await renderToString(app, ssrContext)
    expect(loggerSpy).toHaveBeenCalledWith('Failed to get SSR context.', {
      asyncDataKeys: ['examplePayload'],
      bubbleCacheability: false,
      cacheKey: 'foobar',
      cacheTags: ['test'],
      maxAge: undefined,
      noCache: false,
      staleIfError: undefined,
      tag: undefined,
    })
  })
})
