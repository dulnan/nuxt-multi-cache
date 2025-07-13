import type { H3Event } from 'h3'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'
import { useCDNHeaders } from './../../src/runtime/composables/useCDNHeaders'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

const now = new Date(2025, 5, 5, 12, 0, 0, 0)
const nowTimestamp = toTimestamp(now)

function buildEvent(): H3Event {
  return {
    context: {
      multiCache: {
        cdn: new NuxtMultiCacheCDNHelper(nowTimestamp),
      },
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

let isServerValue = false

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return isServerValue
    },
    debug: false,
    cdnEnabled: true,
    cdnCacheControlHeader: 'Surrogate-Control',
    cdnCacheTagHeader: 'Cache-Tag',
  }
})

describe('useCDNHeaders composable', () => {
  beforeEach(() => {
    isServerValue = false
  })
  test('Does not call callback in client', () => {
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Calls callback on server', () => {
    isServerValue = true
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any, buildEvent())
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    isServerValue = true
    const dummyHelper = new NuxtMultiCacheCDNHelper(nowTimestamp)

    useCDNHeaders(
      (helper) => {
        expect(helper).toEqual(dummyHelper)
      },
      {
        context: {
          multiCache: {
            cdn: dummyHelper,
          },
        },
      } as any,
    )
  })

  test('Gets the event from SSR context.', () => {
    isServerValue = true

    useCDNHeaders((helper) => {
      expect(helper).toHaveProperty('_control')
    })
  })

  test('Does not call callback if event is missing.', () => {
    isServerValue = true

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useCDNHeaders(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })
})
