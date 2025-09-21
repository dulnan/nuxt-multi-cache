import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheRouteCacheHelper } from '../../src/runtime/helpers/RouteCacheHelper'
import {
  getMultiCacheContext,
  getMultiCacheRouteHelper,
  MULTI_CACHE_CONTEXT_KEY,
} from './../../src/runtime/helpers/server'
import { toTimestamp } from '~/src/runtime/helpers/maxAge'

const mockDate = new Date('2024-03-15T10:30:00.000Z')
const mockDateTimestamp = toTimestamp(mockDate)

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
      route: new NuxtMultiCacheRouteCacheHelper(mockDateTimestamp),
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
