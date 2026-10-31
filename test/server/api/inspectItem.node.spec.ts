import { describe, expect, test, vi } from 'vitest'
import { createStorage } from 'unstorage'
import inspectItem from './../../../src/runtime/server/api/inspectItem'

const mocks = vi.hoisted(() => {
  return {
    useNitroApp: vi.fn(),
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    useNitroApp: mocks.useNitroApp,
  }
})

vi.mock('h3', async () => {
  const h3: any = await vi.importActual('h3')
  return {
    ...h3,
    readBody: (event: any) => {
      return event.body
    },
  }
})

// Authorization is tested separately.
vi.mock('./../../../src/runtime/server/api/helpers', async (importOriginal) => {
  return {
    ...(await importOriginal<
      typeof import('./../../../src/runtime/server/api/helpers')
    >()),
    checkAuth: () => {
      return Promise.resolve()
    },
  }
})

async function doInspect(
  storage: any,
  cache: string,
  key: string,
  responseHeaders: Record<string, unknown> = {},
) {
  mocks.useNitroApp.mockReturnValue({
    multiCache: {
      cache: {
        [cache]: { storage },
      },
      serverOptions: {
        api: {
          authorization: () => {
            return Promise.resolve(true)
          },
        },
      },
      config: {
        api: {},
      },
    },
  })
  const result = await inspectItem({
    context: {
      params: {
        cacheName: cache,
      },
    },
    path: `/api/inspect/${cache}?key=${key}`,
    node: {
      req: {
        url: `http://localhost:3000/api/inspect/${cache}?key=${key}`,
      },
      res: {
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        setHeader: (name: string, value: unknown) => {
          responseHeaders[name.toLowerCase()] = value
        },
      },
    },
    __CACHE_NAME: cache,
  } as any)

  mocks.useNitroApp.mockRestore()

  return result
}

describe('inspectItem API handler', () => {
  test('Returns details for a component cache item.', async () => {
    const storage = createStorage()
    storage.setItem('component1', '<div>Hello world</div>')
    storage.setItem('component2', { markup: '<div>Object OBJECT</div>' })

    expect(
      await doInspect(storage, 'component', 'component1'),
    ).toMatchInlineSnapshot('"<div>Hello world</div>"')

    expect(await doInspect(storage, 'component', 'component2'))
      .toMatchInlineSnapshot(`
      {
        "markup": "<div>Object OBJECT</div>",
      }
    `)
  })

  test('Returns details for a data cache item.', async () => {
    const storage = createStorage()
    storage.setItem('data1', 'My data')
    storage.setItem('data2', { data: 'My second data' })

    expect(await doInspect(storage, 'data', 'data1')).toMatchInlineSnapshot(
      '"My data"',
    )

    expect(await doInspect(storage, 'data', 'data2')).toMatchInlineSnapshot(`
      {
        "data": "My second data",
      }
    `)
  })

  test('Sends items stored as strings as plain text.', async () => {
    const storage = createStorage()
    // Route and component items are stored as strings, which h3 would send as
    // text/html. Their markup is inert in its original context, e.g. a JSON
    // response.
    storage.setItem(
      'route1',
      '{"headers":{}}<CACHE_ITEM>{"comment":"<img src=x onerror=alert(1)>"}',
    )
    storage.setItem('data1', { data: '<img src=x onerror=alert(1)>' })

    const routeHeaders: Record<string, unknown> = {}
    await doInspect(storage, 'route', 'route1', routeHeaders)
    expect(routeHeaders['content-type']).toEqual('text/plain; charset=utf-8')

    // Objects are sent as JSON by h3.
    const dataHeaders: Record<string, unknown> = {}
    await doInspect(storage, 'data', 'data1', dataHeaders)
    expect(dataHeaders['content-type']).toBeUndefined()
  })

  test('Throws 404 if item is not found.', async () => {
    const storage = createStorage()
    await expect(
      doInspect(storage, 'data', 'foobar'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Cache item does not exist.]`,
    )
  })
})
