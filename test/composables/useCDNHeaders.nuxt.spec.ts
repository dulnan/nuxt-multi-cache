import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, test, vi } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'
import { useCDNHeaders } from './../../src/runtime/composables'

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    // @ts-ignore
    ...actual,
    useSSRContext: () => {
      return {
        event: {
          __MULTI_CACHE_CDN: new NuxtMultiCacheCDNHelper(),
        },
      }
    },
    getCurrentInstance: () => {
      return true
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

describe('useCDNHeaders composable', () => {
  test('Does not call callback in client', () => {
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Calls callback on server', () => {
    import.meta.env.VITEST_SERVER = 'true'
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    import.meta.env.VITEST_SERVER = 'true'
    const dummyHelper = 'dummy helper'

    useCDNHeaders(
      (helper) => {
        expect(helper).toEqual(dummyHelper)
      },
      {
        __MULTI_CACHE_CDN: dummyHelper,
      } as any,
    )
  })

  test('Gets the event from SSR context.', () => {
    import.meta.env.VITEST_SERVER = 'true'

    useCDNHeaders((helper) => {
      expect(helper).toHaveProperty('_control')
    })
  })

  test('Does not call callback if event is missing.', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const vue = await import('vue')
    vue.useSSRContext = vi.fn().mockReturnValueOnce({})

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Does not call callback if CDN helper is missing.', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const vue = await import('vue')
    vue.useSSRContext = vi.fn().mockReturnValueOnce({
      event: {},
    })

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })
})
