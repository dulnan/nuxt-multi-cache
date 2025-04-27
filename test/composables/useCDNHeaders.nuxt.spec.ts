import type { H3Event } from 'h3'
import { describe, expect, test, vi } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'
import { useCDNHeaders } from './../../src/runtime/composables/useCDNHeaders'

function buildEvent(): H3Event {
  return {
    context: {
      __MULTI_CACHE_CDN: new NuxtMultiCacheCDNHelper(),
    },
  } as H3Event
}

vi.mock('#imports', () => {
  return {
    useRequestEvent: () => {
      return buildEvent()
    },
    useRuntimeConfig: () => {
      return {
        multiCache: {
          data: true,
        },
      }
    },
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
    useCDNHeaders(spyCallback as any, buildEvent())
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    import.meta.env.VITEST_SERVER = 'true'
    const dummyHelper = new NuxtMultiCacheCDNHelper()

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
    import.meta.env.VITEST_SERVER = 'true'

    useCDNHeaders((helper) => {
      expect(helper).toHaveProperty('_control')
    })
  })

  test('Does not call callback if event is missing.', () => {
    import.meta.env.VITEST_SERVER = 'true'

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })
})
