/* eslint-disable vue/one-component-per-file */
import { createSSRApp, defineComponent } from 'vue'
import RenderCacheable from '../../../../src/runtime/components/RenderCacheable'

export function createTestApp(
  props = 'cache-key="foobar"',
  what = 'world',
  providedStorage: any = {},
  name = 'InnerComponent',
) {
  const InnerComponent = defineComponent({
    name,
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

  const storage: Record<string, any> = providedStorage || {}

  const ssrContext = {
    event: {
      context: {
        __MULTI_CACHE: {
          component: {
            setItem: (key: string, data: any) => {
              if (key === 'InnerComponent::set_error') {
                throw new Error('Failed to set item.')
              }
              storage[key] = data
            },
            getItem(key: string) {
              if (key === 'InnerComponent::get_error') {
                throw new Error('Failed to get item.')
              }
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
