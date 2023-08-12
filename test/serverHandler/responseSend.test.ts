import { describe, expect, test, vi, afterEach, beforeEach } from 'vitest'
import { createStorage } from 'unstorage'
import { sleep } from '../__helpers__'
import responseSend from '../../src/runtime/serverHandler/responseSend'
import { decodeRouteCacheItem } from '../../src/runtime/helpers/cacheItem'

// vi.stubGlobal('useRuntimeConfig', useRuntimeConfig)
vi.mock('#imports', () => {
  const useRuntimeConfig = () => {
    return {
      multiCache: {
        cdn: {
          cacheTagHeader: 'Cache-Tag',
          cacheControlHeader: 'Surrogate-Control',
        },
      },
    }
  }

  return {
    useRuntimeConfig,
  }
})

vi.mock('#multi-cache-server-options', () => {
  return {
    default: {},
  }
})

describe('responseSend server handler', () => {
  test('Returns if route cache or CDN helper is not available.', () => {
    const event: any = {
      path: '/test',
      node: {
        res: {},
      },
      context: {},
    }

    expect(responseSend(event)).toBeUndefined()
  })

  test('Overwrites response.end method', () => {
    const storage = createStorage()
    const event: any = {
      path: '/test',
      node: {
        res: {
          end: {},
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
      },
    }

    expect(event.node.res.end).toMatchInlineSnapshot('{}')
    responseSend(event)
    expect(event.node.res.end).toMatchInlineSnapshot('[Function]')
  })

  test('Calls original end method if no chunk is provided.', () => {
    const storage = createStorage()
    const res = {
      end: () => {},
    }
    const endSpy = vi.spyOn(res, 'end')
    const event: any = {
      path: '/test',
      node: {
        res: {
          end: endSpy,
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
      },
    }

    responseSend(event)
    event.node.res.end(() => {})

    expect(endSpy).toHaveBeenCalledOnce()
  })

  test('Calls original end method after setting cache item.', () => {
    const storage = createStorage()
    const res = {
      end: () => {},
    }
    const endSpy = vi.spyOn(res, 'end')
    const event: any = {
      path: '/test',
      node: {
        res: {
          end: endSpy,
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
        __MULTI_CACHE_ROUTE: {
          cacheable: true,
          tags: [],
        },
      },
    }

    responseSend(event)
    event.node.res.end(() => {})

    expect(endSpy).toHaveBeenCalledOnce()
  })

  test('Caches a cacheable route.', async () => {
    const storage = createStorage()
    const event: any = {
      path: '/test/route/nested',
      node: {
        res: {
          end: () => {},
          getHeaders() {
            return {
              'x-test': 'Foobar',
            }
          },
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
        __MULTI_CACHE_ROUTE: {
          cacheable: true,
          tags: [],
        },
      },
    }

    responseSend(event)

    event.node.res.end('<html></html>')
    await sleep(100)

    expect(await storage.getItemRaw('test:route:nested')).toMatchInlineSnapshot(
      '"{\\"headers\\":{\\"x-test\\":\\"Foobar\\"},\\"cacheTags\\":[]}<CACHE_ITEM><html></html>"',
    )
  })

  test('Does not cache an uncacheable route.', async () => {
    const storage = createStorage()
    const event: any = {
      path: '/test/route/nested',
      node: {
        res: {
          end: () => {},
          getHeaders() {
            return {
              'x-test': 'Foobar',
            }
          },
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
        __MULTI_CACHE_ROUTE: {
          cacheable: false,
          tags: [],
        },
      },
    }

    responseSend(event)

    event.node.res.end('<html></html>')
    await sleep(100)

    expect(await storage.getItemRaw('test:route:nested')).toBeNull()
  })

  test('Adds cache tags to cached route.', async () => {
    const storage = createStorage()
    const event: any = {
      path: '/test/route/nested',
      node: {
        res: {
          end: () => {},
          getHeaders() {
            return {
              'x-test': 'Foobar',
            }
          },
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
        __MULTI_CACHE_ROUTE: {
          cacheable: true,
          tags: ['one', 'two'],
        },
      },
    }

    responseSend(event)

    event.node.res.end('<html></html>')
    await sleep(100)
    const item: any = await storage.getItemRaw('test:route:nested')
    expect(decodeRouteCacheItem(item)?.cacheTags).toEqual(['one', 'two'])
  })

  test('Sets the expires property for cache items.', async () => {
    const storage = createStorage()
    const event: any = {
      path: '/test/route/nested',
      node: {
        res: {
          end: () => {},
          getHeaders() {
            return {
              'x-test': 'Foobar',
            }
          },
        },
      },
      context: {
        __MULTI_CACHE: {
          route: storage,
        },
        __MULTI_CACHE_ROUTE: {
          cacheable: true,
          // 1 hour.
          maxAge: 60 * 60,
          tags: [],
        },
      },
    }

    const date = new Date(2022, 11, 29, 13, 0)
    vi.setSystemTime(date)

    responseSend(event)

    event.node.res.end('<html></html>')
    await sleep(100)
    const item: any = await storage.getItemRaw('test:route:nested')
    expect(
      new Date(decodeRouteCacheItem(item)!.expires! * 1000),
    ).toMatchInlineSnapshot('2022-12-29T14:00:00.000Z')
  })

  test('Sets the CDN headers.', () => {
    const event: any = {
      path: '/test/route/nested',
      node: {
        res: {
          headers: {} as Record<string, any>,
          end: () => {},
          setHeader(key: string, value: string) {
            this.headers[key] = value
          },
        },
      },
      context: {
        __MULTI_CACHE_CDN: {
          _tags: ['one', 'two'],
          _control: {
            maxAge: 9000,
            staleIfError: 33333,
            private: true,
          },
        },
      },
    }

    responseSend(event)

    event.node.res.end('<html></html>')

    expect(event.node.res.headers).toMatchInlineSnapshot(`
      {
        "Cache-Tag": "one two",
        "Surrogate-Control": "max-age=9000, private, stale-if-error=33333",
      }
    `)
  })
})
