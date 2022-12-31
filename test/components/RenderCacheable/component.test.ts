/* eslint-disable vue/one-component-per-file */
import { defineComponent, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RenderCacheable from '../../../src/runtime/components/RenderCacheable'
import { createTestApp } from './__helpers__'

const EXAMPLE_PAYLOAD = {
  data: 'This is example payload.',
}

const nuxtApp = {
  payload: {
    data: {
      examplePayload: EXAMPLE_PAYLOAD,
    },
  },
}

vi.mock('#app', () => {
  return {
    useNuxtApp: () => {
      return nuxtApp
    },
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
    const InnerComponent = defineComponent({
      template: `
      <div>Hello world</div>
      `,
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
    process.server = true

    const { app, ssrContext, storage } = createTestApp()
    const first = await renderToString(app, ssrContext)

    expect(first).toMatchInlineSnapshot(
      '"<div><div>Test App</div><div data-cacheable-key=\\"InnerComponent::foobar\\"><div>Hello world</div></div></div>"',
    )
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      '"<div>Hello world</div>"',
    )
  })

  test('Returns cached markup if available.', async () => {
    process.server = true

    const { app, ssrContext, storage } = createTestApp()
    const mockedMarkup = `<div>Markup from cache</div>`
    storage['InnerComponent::foobar'] = mockedMarkup
    const first = await renderToString(app, ssrContext)

    expect(first).toMatchInlineSnapshot(
      '"<div><div>Test App</div><div data-cacheable-key=\\"InnerComponent::foobar\\"><div>Markup from cache</div></div></div>"',
    )
    expect(storage['InnerComponent::foobar']).toEqual(mockedMarkup)
  })

  test('Adds cache tags to the cache entry.', async () => {
    process.server = true

    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']"`,
    )
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      `
      {
        "cacheTags": [
          "test",
        ],
        "data": "<div>Hello world</div>",
        "payload": {},
      }
    `,
    )
  })

  test('Caches payload alongside component if asyncDataKeys is provided.', async () => {
    process.server = true

    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      `
      {
        "cacheTags": [
          "test",
        ],
        "data": "<div>Hello world</div>",
        "payload": {
          "examplePayload": {
            "data": "This is example payload.",
          },
        },
      }
    `,
    )
  })

  test('Calculates expires value when maxAge is provided.', async () => {
    process.server = true
    const date = new Date(2022, 11, 1)
    vi.setSystemTime(date)

    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="withExpiration" :max-age="1800"`,
    )
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::withExpiration']).toMatchInlineSnapshot(`
      {
        "cacheTags": [],
        "data": "<div>Hello world</div>",
        "expires": 1669854600,
        "payload": {},
      }
    `)
  })

  test('Renders a component from cache.', async () => {
    process.server = true

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
      '',
      {
        'InnerComponent::foobar': '<h1>FROM CACHE</h1>',
      },
    )
    const result = await renderToString(app, ssrContext)
    expect(result).toMatchInlineSnapshot(
      '"<div><div>Test App</div><div data-cacheable-key=\\"InnerComponent::foobar\\"><h1>FROM CACHE</h1></div></div>"',
    )
  })

  test('Does not render a component which is expired', async () => {
    process.server = true

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
    const result = await renderToString(app, ssrContext)
    expect(result).not.toContain('SHOULD NOT BE RENDERED')
  })

  test('Adds payload to nuxt app from a cached component', async () => {
    process.server = true

    const appImport = await import('#app')
    const localNuxtApp = { payload: { data: {} } }
    appImport.useNuxtApp = vi.fn().mockReturnValueOnce(localNuxtApp)

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
      '',
      {
        'InnerComponent::foobar': {
          data: '<div>Hello</div>',
          payload: { myPayload: 'Foobar' },
        },
      },
    )

    expect(localNuxtApp.payload.data).toEqual({})
    await renderToString(app, ssrContext)
    expect(localNuxtApp.payload.data).toEqual({ myPayload: 'Foobar' })
  })

  test('Uses props to infer cache key.', async () => {
    process.server = true

    const { app, ssrContext, storage } = createTestApp('', 'neptun')
    await renderToString(app, ssrContext)
    expect(storage).toMatchInlineSnapshot(`
      {
        "InnerComponent::bJdWg6O7EU": "<div>Hello neptun</div>",
      }
    `)
  })

  test('Bails if no cache key could be generated.', async () => {
    process.server = true

    const { app, ssrContext, storage } = createTestApp('', 'neptun', {}, '')
    await renderToString(app, ssrContext)
    expect(storage).toMatchInlineSnapshot('{}')
  })

  test('Handles errors when getting cache item.', async () => {
    process.server = true
    const consoleSpy = vi.spyOn(global.console, 'error')

    const appImport = await import('#app')
    const localNuxtApp = { payload: { data: {} } }
    appImport.useNuxtApp = vi.fn().mockReturnValueOnce(localNuxtApp)

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(`cacheKey="get_error"`)

    expect(localNuxtApp.payload.data).toEqual({})
    await renderToString(app, ssrContext)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to get item.')
  })

  test('Handles errors when setting cache item.', async () => {
    process.server = true
    const consoleSpy = vi.spyOn(global.console, 'error')

    const appImport = await import('#app')
    const localNuxtApp = { payload: { data: {} } }
    appImport.useNuxtApp = vi.fn().mockReturnValueOnce(localNuxtApp)

    // App with storage containing a cached component.
    const { app, ssrContext } = createTestApp(`cacheKey="set_error"`)

    expect(localNuxtApp.payload.data).toEqual({})
    await renderToString(app, ssrContext)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to set item.')
  })
})
