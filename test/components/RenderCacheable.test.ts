/* eslint-disable vue/one-component-per-file */
import { createSSRApp, defineComponent, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RenderCacheable from '../../src/runtime/components/RenderCacheable'

const EXAMPLE_PAYLOAD = {
  data: 'This is example payload.',
}

vi.mock('#app', () => {
  return {
    useNuxtApp: () => {
      return {
        payload: {
          data: {
            examplePayload: EXAMPLE_PAYLOAD,
          },
        },
      }
    },
  }
})

function createTestApp(props = 'cache-key="foobar"', what = 'world') {
  const InnerComponent = defineComponent({
    name: 'InnerComponent',
    props: {
      what: {
        type: String,
        default: 'world',
      },
    },
    template: `
        <div>Hello {{ what }}</div>
      `,
  })
  const TestComponent = defineComponent({
    components: { RenderCacheable, InnerComponent },
    template: `<Suspense>
        <RenderCacheable ${props}>
          <InnerComponent :what="'${what}'" />
        </RenderCacheable>
      </Suspense>`,
  })

  const storage: Record<string, any> = {}

  const ssrContext = {
    event: {
      context: {
        __MULTI_CACHE: {
          component: {
            setItem: (key: string, data: any) => {
              storage[key] = data
            },
            getItem(key: string) {
              return storage[key]
            },
          },
        },
      },
    },
  }
  const app = createSSRApp({
    components: {
      TestComponent,
    },
    template: `
        <div>
          <div>Test App</div>
          <TestComponent />
        </div>
      `,
  })

  return { app, ssrContext, storage }
}

describe('RenderCacheable', () => {
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
      '"{\\"payload\\":{},\\"markup\\":\\"<div>Hello world</div>\\",\\"cacheTags\\":[\\"test\\"]}"',
    )
  })

  test('Caches payload alongside component if asyncDataKeys is provided.', async () => {
    process.server = true

    const { app, ssrContext, storage } = createTestApp(
      `cacheKey="foobar" :cacheTags="['test']" :asyncDataKeys="['examplePayload']"`,
    )
    await renderToString(app, ssrContext)
    expect(storage['InnerComponent::foobar']).toMatchInlineSnapshot(
      '"{\\"payload\\":{\\"examplePayload\\":{\\"data\\":\\"This is example payload.\\"}},\\"markup\\":\\"<div>Hello world</div>\\",\\"cacheTags\\":[\\"test\\"]}"',
    )
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
})
