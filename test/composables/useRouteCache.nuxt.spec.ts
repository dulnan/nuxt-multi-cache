import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, test, vi } from 'vitest'
import { useRouteCache } from './../../src/runtime/composables'
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

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  const storage: Record<string, any> = {
    foobar: 'Cached data.',
  }
  return {
    // @ts-ignore
    ...actual,
    useSSRContext: () => {
      return {
        event: {
          context: {
            __MULTI_CACHE: {
              data: {
                getItem: (key: string) => {
                  return Promise.resolve(storage[key])
                },
                setItem: (key: string, data: any) => {
                  storage[key] = data
                  return Promise.resolve()
                },
              },
            },
            __MULTI_CACHE_ROUTE: new NuxtMultiCacheRouteCacheHelper(),
          },
        },
      }
    },
    getCurrentInstance: () => {
      return true
    },
  }
})

describe('useRouteCache composable', () => {
  test('Does not call callback in client', () => {
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Calls callback on server', () => {
    import.meta.env.VITEST_SERVER = 'true'
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    import.meta.env.VITEST_SERVER = 'true'
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
    import.meta.env.VITEST_SERVER = 'true'

    useRouteCache((helper) => {
      expect(helper).toHaveProperty('tags')
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
    useRouteCache(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Does not call callback if route helper is missing.', async () => {
    import.meta.env.VITEST_SERVER = 'true'

    const vue = await import('vue')
    vue.useSSRContext = vi.fn().mockReturnValueOnce({
      event: {},
    })

    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })
})
