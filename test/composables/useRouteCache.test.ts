import { describe, expect, test, vi } from 'vitest'
import { useRouteCache } from './../../src/runtime/composables'
import { NuxtMultiCacheRouteCacheHelper } from './../../src/runtime/helpers/RouteCacheHelper'

vi.mock('vue', () => {
  const storage: Record<string, any> = {
    foobar: 'Cached data.',
  }
  return {
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
  }
})

describe('useRouteCache composable', () => {
  test('Does not call callback in client', () => {
    process.client = true
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).not.toHaveBeenCalled()
  })

  test('Calls callback on server', () => {
    process.client = false
    const params = {
      cb() {},
    }

    const spyCallback = vi.spyOn(params, 'cb')
    useRouteCache(spyCallback as any)
    expect(spyCallback).toHaveBeenCalledOnce()
  })

  test('Uses the provided event.', () => {
    process.client = false
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
    process.client = false

    useRouteCache((helper) => {
      expect(helper).toHaveProperty('tags')
    })
  })
})
