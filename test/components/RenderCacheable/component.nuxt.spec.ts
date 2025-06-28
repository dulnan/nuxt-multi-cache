/* eslint-disable vue/one-component-per-file */
import { defineComponent, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RenderCacheable from '../../../src/runtime/components/RenderCacheable'
import { encodeComponentCacheItem } from '../../../src/runtime/helpers/cacheItem'
import { createTestApp } from './__helpers__'

vi.mock('#imports', () => {
  return {
    useRuntimeConfig: () => {
      return {
        multiCache: {
          component: true,
          debug: true,
        },
      }
    },
  }
})

const EXAMPLE_PAYLOAD = {
  data: 'This is example payload.',
}

const mocks = vi.hoisted(() => {
  return {
    useNuxtApp: vi.fn(),
  }
})

vi.mock('#app', () => {
  return {
    useNuxtApp: mocks.useNuxtApp,
  }
})

const { getIsServer, setIsServer } = vi.hoisted(() => {
  let serverValue = false

  return {
    getIsServer: vi.fn(() => serverValue),
    setIsServer: (value: boolean) => {
      serverValue = value
    },
  }
})

// Use the hoisted function in the mock
vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isServer() {
      return getIsServer()
    },
    debug: false,
    cdnEnabled: true,
  }
})

describe('RenderCacheable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  test('Renders the default slot', async () => {
    setIsServer(true)
    const InnerComponent = defineComponent({
      template: `
      <div>Hello world</div>
      `,
    })
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext: {},
        event: {},
        payload: {
          data: {},
        },
      }
    })
    const TestComponent = defineComponent({
      components: { RenderCacheable, InnerComponent },
      template: `<Suspense>
      <RenderCacheable>
        <InnerComponent />
      </RenderCacheable>
      </Suspense>`,
    })
    const wrapper = mount(TestComponent)
    await nextTick()
    expect(wrapper.html()).toMatchInlineSnapshot(`
      "<div>
        <div>Hello world</div>
      </div>"
    `)
  })

  test('Renders nothing if default slot is empty', async () => {
    setIsServer(true)
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext: {},
        event: {},
        payload: {
          data: {},
        },
      }
    })
    const TestComponent = defineComponent({
      components: { RenderCacheable },
      template: `<Suspense>
      <RenderCacheable>
      </RenderCacheable>
      </Suspense>`,
    })
    const wrapper = mount(TestComponent)
    await nextTick()
    expect(wrapper.html()).toBeFalsy()
  })

  test('Puts markup in cache', async () => {
    setIsServer(true)
    const { app, ssrContext, storage } = createTestApp()

    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })

    const first = await renderToString(app, ssrContext)

    expect(first).toMatchInlineSnapshot(
      '"<div><div>Test App</div><div><div>Hello world</div></div></div>"',
    )
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      `"{"payload":{},"cacheTags":[],"ssrModules":[]}<CACHE_ITEM><div>Hello world</div>"`,
    )
  })

  test('Returns cached markup if available.', async () => {
    setIsServer(true)
    const { app, ssrContext, storage } = createTestApp()
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    const mockedMarkup = `<div>Markup from cache</div>`
    storage['InnerComponent::foobar'] = encodeComponentCacheItem(mockedMarkup)
    const first = await renderToString(app, ssrContext)

    expect(first).toMatchInlineSnapshot(
      `"<div><div>Test App</div><div><div>Markup from cache</div></div></div>"`,
    )
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      '"{}<CACHE_ITEM><div>Markup from cache</div>"',
    )
  })

  test('Adds cache tags to the cache entry.', async () => {
    setIsServer(true)
    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']"`,
    )
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      `"{"payload":{},"cacheTags":["test"],"ssrModules":[]}<CACHE_ITEM><div>Hello world</div>"`,
    )
  })

  test('Caches payload alongside component if asyncDataKeys is provided.', async () => {
    setIsServer(true)
    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {
            examplePayload: EXAMPLE_PAYLOAD,
          },
        },
      }
    })
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      `"{"payload":{"examplePayload":{"data":"This is example payload."}},"cacheTags":["test"],"ssrModules":[]}<CACHE_ITEM><div>Hello world</div>"`,
    )
  })

  test('Calculates expires value when maxAge is provided.', async () => {
    setIsServer(true)
    const date = new Date(2022, 11, 1)
    vi.setSystemTime(date)

    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="withExpiration" :max-age="1800"`,
    )
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::withExpiration']).toMatchInlineSnapshot(
      `"{"payload":{},"expires":1669854600,"cacheTags":[],"ssrModules":[]}<CACHE_ITEM><div>Hello world</div>"`,
    )
  })

  test('Renders a component from cache.', async () => {
    setIsServer(true)
    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
      '',
      {
        'InnerComponent::foobar': '<h1>FROM CACHE</h1>',
      },
    )
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    const result = await renderToString(app, ssrContext)
    expect(result).toMatchInlineSnapshot(
      '"<div><div>Test App</div><div><div>Hello </div></div></div>"',
    )
  })

  test('Does not render a component which is expired', async () => {
    setIsServer(true)
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
      '',
      {
        'InnerComponent::foobar': {
          data: '<div>SHOULD NOT BE RENDERED</div>',
          payload: { myPayload: 'Foobar' },
          expires: 1000,
        },
      },
    )
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    const result = await renderToString(app, ssrContext)
    expect(result).not.toContain('SHOULD NOT BE RENDERED')
  })

  test('Adds payload to nuxt app from a cached component', async () => {
    setIsServer(true)
    const payload = { data: {} }

    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload,
      }
    })

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
      '',
      {
        'InnerComponent::foobar': encodeComponentCacheItem('<div>Hello</div>', {
          myPayload: 'Foobar',
        }),
      },
    )

    expect(payload.data).toEqual({})
    await renderToString(app, ssrContext)
    expect(payload.data).toEqual({ myPayload: 'Foobar' })
  })

  test('Uses props to infer cache key.', async () => {
    setIsServer(true)
    const { app, ssrContext, storage } = createTestApp('', 'neptun')
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    await renderToString(app, ssrContext)
    expect(storage).toMatchInlineSnapshot(`
      {
        "InnerComponent::CKAyMFHC05PW5FiE4G9tlfYrHyHI5577VSf3tQI76Wg": "{"payload":{},"cacheTags":[],"ssrModules":[]}<CACHE_ITEM><div>Hello neptun</div>",
      }
    `)
  })

  test('Bails if no cache key could be generated.', async () => {
    setIsServer(true)
    const { app, ssrContext, storage } = createTestApp('', 'neptun', {}, '')
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    await renderToString(app, ssrContext)
    expect(storage).toMatchInlineSnapshot('{}')
  })

  test('Handles errors when getting cache item.', async () => {
    setIsServer(true)
    const consoleSpy = vi.spyOn(global.console, 'error')
    const payload = { data: {} }

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(`cacheKey="get_error"`)
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload,
      }
    })

    expect(payload.data).toEqual({})
    await renderToString(app, ssrContext)
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Failed to get component cache item.",
        {
          "fullCacheKey": "InnerComponent::get_error",
        },
      ]
    `)
  })

  test('Handles errors when setting cache item.', async () => {
    setIsServer(true)
    const consoleSpy = vi.spyOn(global.console, 'error')
    const payload = { data: {} }

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(`cacheKey="set_error"`)
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload,
      }
    })

    expect(payload.data).toEqual({})
    await renderToString(app, ssrContext)
    expect(consoleSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        "Failed to store component in cache.",
        {
          "fullCacheKey": "InnerComponent::set_error",
          "props": {
            "asyncDataKeys": [],
            "cacheKey": "set_error",
            "cacheTags": [],
            "maxAge": 0,
            "noCache": false,
            "tag": "div",
          },
        },
        [Error: Failed to set item.],
      ]
    `)
  })

  test('Bubbles errors when getting cache item.', async () => {
    setIsServer(true)

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="get_error"`,
      'world',
      {},
      'InnerComponent',
      true,
    )
    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })
    const errorHandlerSpy = vi.fn()
    app.config.errorHandler = errorHandlerSpy
    const result = await renderToString(app, ssrContext)

    expect(errorHandlerSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        [Error: Failed to get item.],
        {
          "asyncDataKeys": [],
          "cacheKey": "get_error",
          "cacheTags": [],
          "maxAge": 0,
          "noCache": false,
          "tag": "div",
        },
        "setup function",
      ]
    `)

    expect(result).toMatchInlineSnapshot(
      `"<div><div>Test App</div><!----></div>"`,
    )
  })

  test('Bubbles errors when setting cache item.', async () => {
    setIsServer(true)
    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="set_error"`,
      'world',
      {},
      'InnerComponent',
      true,
    )

    mocks.useNuxtApp.mockImplementation(() => {
      return {
        ssrContext,
        event: ssrContext.event,
        payload: {
          data: {},
        },
      }
    })

    const errorHandlerSpy = vi.fn()
    app.config.errorHandler = errorHandlerSpy
    const result = await renderToString(app, ssrContext)

    expect(errorHandlerSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        [Error: Failed to set item.],
        {
          "asyncDataKeys": [],
          "cacheKey": "set_error",
          "cacheTags": [],
          "maxAge": 0,
          "noCache": false,
          "tag": "div",
        },
        "setup function",
      ]
    `)

    expect(result).toMatchInlineSnapshot(
      `"<div><div>Test App</div><!----></div>"`,
    )
  })
})
