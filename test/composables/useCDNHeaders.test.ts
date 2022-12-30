import { describe, expect, test, vi } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'
import { useCDNHeaders } from './../../src/runtime/composables'

vi.mock('vue', () => {
  return {
    useSSRContext: () => {
      return {
        event: {
          context: {
            __MULTI_CACHE_CDN: new NuxtMultiCacheCDNHelper(),
          },
        },
      }
    },
  }
})

describe('useCDNHeaders composable', () => {
  test('Does not call callback in client', () => {
    process.client = true
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Calls callback on server', () => {
    process.client = false
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    process.client = false
    const dummyHelper = 'dummy helper'

    useCDNHeaders(
      (helper) => {
        expect(helper).toEqual(dummyHelper)
      },
      {
        context: {
          __MULTI_CACHE_CDN: dummyHelper,
        },
      } as any,
    )
  })

  test('Gets the event from SSR context.', () => {
    process.client = false

    useCDNHeaders((helper) => {
      expect(helper).toHaveProperty('_control')
    })
  })

  test('Does not call callback if event is missing.', async () => {
    process.client = false

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
    process.client = false

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
