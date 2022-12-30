import { renderToString } from 'vue/server-renderer'
import { describe, expect, test, vi } from 'vitest'
import { createTestApp } from './__helpers__'

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

    const consoleSpy = vi.spyOn(global.console, 'log')

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    await renderToString(app, ssrContext)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to get parent component in Cacheable component.',
    )
  })

  test('Bails if SSR context could not be found', async () => {
    process.server = true

    const consoleSpy = vi.spyOn(global.console, 'log')

    const vue = await import('vue')
    vue.getCurrentInstance = vi.fn().mockReturnValue({ parent: {} })

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    await renderToString(app, ssrContext)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to get SSR context.')
  })

  test('Bails if component cache is not available.', async () => {
    process.server = true

    const consoleSpy = vi.spyOn(global.console, 'log')

    const vue = await import('vue')
    vue.getCurrentInstance = vi.fn().mockReturnValue({ parent: {} })
    vue.useSSRContext = vi.fn().mockReturnValue({ event: {} })

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )

    await renderToString(app, ssrContext)
    expect(consoleSpy).toHaveBeenCalledWith('Component cache is disabled.')
  })
})
