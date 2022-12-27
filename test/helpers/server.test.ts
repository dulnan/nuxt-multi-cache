import { describe, expect, test, vi } from 'vitest'
import {
  getMultiCacheContext,
  getMultiCacheRouteContext,
} from './../../src/runtime/helpers/server'

const EVENT: any = {
  context: {
    __MULTI_CACHE: {
      component: {
        getItem: () => {},
      },
    },
    __MULTI_CACHE_ROUTE: {
      tags: [],
      cacheable: null,
      control: {},
    },
  },
}

describe('Server helpers', () => {
  test('getMultiCacheContext', () => {
    expect(getMultiCacheContext({} as any)).toBeUndefined()
    expect(getMultiCacheContext(EVENT)).toEqual(EVENT.context.__MULTI_CACHE)
  })

  test('getMultiCacheRouteContext', () => {
    expect(getMultiCacheRouteContext({} as any)).toBeUndefined()
    expect(getMultiCacheRouteContext(EVENT)).toEqual(
      EVENT.context.__MULTI_CACHE_ROUTE,
    )
  })
})
