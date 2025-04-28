import type { H3Event } from 'h3'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useRouteCache } from './../../src/runtime/composables/useRouteCache'
import { NuxtMultiCacheRouteCacheHelper } from './../../src/runtime/helpers/RouteCacheHelper'

mockNuxtImport('useRuntimeConfig', () => {
  return () => {
    return {
      multiCache: {
        component: true,
      },
    }
  }
})

let isServerValue = false

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return isServerValue
    },
    debug: false,
  }
})

function buildEvent(): H3Event {
  const storage: Record<string, any> = {
    foobar: 'Cached data.',
  }
  return {
    context: {
      __MULTI_CACHE: {
        data: {
          storage: {
            getItem: (key: string) => {
              return Promise.resolve(storage[key])
            },
            setItem: (key: string, data: any) => {
              storage[key] = data
              return Promise.resolve()
            },
          },
        },
      },
      __MULTI_CACHE_ROUTE: new NuxtMultiCacheRouteCacheHelper(),
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

describe('useRouteCache composable', () => {
  beforeEach(() => {
    isServerValue = false
  })
  test('Does not call callback in client', () => {
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Calls callback on server', () => {
    isServerValue = true
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any, buildEvent())
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    isServerValue = true
    const dummyHelper = 'dummy helper'

    useRouteCache(
      (helper) => {
        expect(helper).toEqual(dummyHelper)
      },
      {
        context: {
          __MULTI_CACHE_ROUTE: dummyHelper,
        },
      } as any,
    )
  })

  test('Gets the event from SSR context.', () => {
    isServerValue = true

    useRouteCache((helper) => {
      expect(helper).toHaveProperty('tags')
    })
  })

  test('Does not call callback if event is missing.', () => {
    isServerValue = true

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Does not call callback if route helper is missing.', () => {
    isServerValue = true

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(
      spyCallback as any,
      {
        context: {
          __MULTI_CACHE_ROUTE: null,
        },
      } as any,
    )
    expect(spyCallback).not.toHaveBeenCalled()
  })
})
