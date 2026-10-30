import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import { getRequestURL, type H3Event } from 'h3'
import type { MultiCacheServerOptions } from '~/src/runtime/types'
import {
  getRouteCacheKey,
  ROOT_ROUTE_CACHE_KEY,
} from '~/src/runtime/helpers/routeCache'

const mocks = vi.hoisted(() => {
  return {
    serverOptions: {} as MultiCacheServerOptions,
  }
})

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: mocks.serverOptions,
  }
})

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    isServer: true,
    isTestMode: false,
  }
})

function buildEvent(path: string): H3Event {
  return {
    path,
    node: {
      req: {
        url: path,
        headers: {
          host: 'localhost',
        },
      },
    },
    context: {},
  } as any
}

describe('getRouteCacheKey', () => {
  beforeEach(() => {
    delete mocks.serverOptions.cacheKeyPrefix
    delete mocks.serverOptions.route
  })

  test('uses the path without the query string', async () => {
    expect(await getRouteCacheKey(buildEvent('/foo/bar?baz=1'))).toEqual(
      '/foo/bar',
    )
  })

  test('uses the root key for the root path', async () => {
    expect(await getRouteCacheKey(buildEvent('/'))).toEqual(
      ROOT_ROUTE_CACHE_KEY,
    )
  })

  test('adds the cache key prefix', async () => {
    mocks.serverOptions.cacheKeyPrefix = 'en'
    expect(await getRouteCacheKey(buildEvent('/foo'))).toEqual('en--/foo')
    expect(await getRouteCacheKey(buildEvent('/'))).toEqual('en--/')
  })

  test('uses a custom buildCacheKey method', async () => {
    mocks.serverOptions.route = {
      buildCacheKey: (event) => 'custom' + getRequestURL(event).pathname,
    }
    expect(await getRouteCacheKey(buildEvent('/foo'))).toEqual('custom/foo')

    mocks.serverOptions.route = {
      buildCacheKey: (event) => getRequestURL(event).pathname,
    }
    expect(await getRouteCacheKey(buildEvent('/'))).toEqual(
      ROOT_ROUTE_CACHE_KEY,
    )
  })

  test('uses a root key that unstorage accepts', async () => {
    const storage = createStorage()
    await expect(storage.setItem('/', 'value')).rejects.toThrow('Invalid key')

    await storage.setItem(ROOT_ROUTE_CACHE_KEY, 'value')
    expect(await storage.getItem(ROOT_ROUTE_CACHE_KEY)).toEqual('value')
  })
})
