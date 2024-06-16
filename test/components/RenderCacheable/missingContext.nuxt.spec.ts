import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, test, vi } from 'vitest'
import { logger } from '../../../src/runtime/helpers/logger'
import { createTestApp } from './__helpers__'

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        component: true,
        debug: true,
      },
    }
  }
})

vi.mock('#app', () => {
  return {
    useNuxtApp: () => {
      return {}
    },
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
    process.server = true

    const loggerSpy = vi.spyOn(logger, 'warn')

    const vue = await import('vue')
    vue.getCurrentInstance = vi.fn().mockReturnValue({ parent: undefined })
    vue.useSSRContext = vi.fn().mockReturnValue({ event: {} })

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    await renderToString(app, ssrContext)
    expect(loggerSpy).toHaveBeenCalledWith(
      'Failed to get parent component in Cacheable component.',
      {
        asyncDataKeys: ['examplePayload'],
        cacheKey: 'foobar',
        cacheTags: ['test'],
        maxAge: 0,
        noCache: false,
        tag: 'div',
      },
    )
  })

  test('Bails if SSR context could not be found', async () => {
    process.server = true

    const loggerSpy = vi.spyOn(logger, 'warn')
    const vue = await import('vue')
    vue.getCurrentInstance = vi.fn().mockReturnValue({ parent: {} })
    vue.useSSRContext = vi.fn().mockReturnValue(undefined)

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    await renderToString(app, ssrContext)
    expect(loggerSpy).toHaveBeenCalledWith('Failed to get SSR context.', {
      asyncDataKeys: ['examplePayload'],
      cacheKey: 'foobar',
      cacheTags: ['test'],
      maxAge: 0,
      noCache: false,
      tag: 'div',
    })
  })
})
