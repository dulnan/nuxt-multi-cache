import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheRouteCacheHelper } from '../../src/runtime/helpers/RouteCacheHelper'
import {
  getMultiCacheContext,
  getMultiCacheRouteHelper,
  MULTI_CACHE_CONTEXT_KEY,
} from './../../src/runtime/helpers/server'

const EVENT: any = {
  context: {
    [MULTI_CACHE_CONTEXT_KEY]: {
      cache: {
        component: {
          storage: {
            getItem: () => {},
          },
        },
      },
    },
    multiCache: {
      route: new NuxtMultiCacheRouteCacheHelper(),
    },
  },
}

describe('Server helpers', () => {
  test('getMultiCacheContext', () => {
    expect(
      getMultiCacheContext({
        context: {},
      } as any),
    ).toBeUndefined()
    expect(getMultiCacheContext(EVENT)).toEqual(
      EVENT.context[MULTI_CACHE_CONTEXT_KEY].cache,
    )
  })

  test('getMultiCacheRouteContext', () => {
    expect(
      getMultiCacheRouteHelper({
        context: {},
      } as any),
    ).toBeUndefined()
    expect(getMultiCacheRouteHelper(EVENT)).toEqual(
      EVENT.context.multiCache.route,
    )
  })
})
