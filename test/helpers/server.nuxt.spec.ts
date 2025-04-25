import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheRouteCacheHelper } from '../../src/runtime/helpers/RouteCacheHelper'
import {
  getMultiCacheContext,
  getMultiCacheRouteHelper,
} from './../../src/runtime/helpers/server'

const EVENT: any = {
  __MULTI_CACHE: {
    component: {
      storage: {
        getItem: () => {},
      },
    },
  },
  __MULTI_CACHE_ROUTE: new NuxtMultiCacheRouteCacheHelper(),
}

describe('Server helpers', () => {
  test('getMultiCacheContext', () => {
    expect(getMultiCacheContext({} as any)).toBeUndefined()
    expect(getMultiCacheContext(EVENT)).toEqual(EVENT.__MULTI_CACHE)
  })

  test('getMultiCacheRouteContext', () => {
    expect(getMultiCacheRouteHelper({} as any)).toBeUndefined()
    expect(getMultiCacheRouteHelper(EVENT)).toEqual(EVENT.__MULTI_CACHE_ROUTE)
  })
})
