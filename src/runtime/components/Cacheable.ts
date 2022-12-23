import {
  defineComponent,
  useSSRContext,
  useSlots,
  getCurrentInstance,
  h,
} from 'vue'
import { ssrRenderSlotInner } from 'vue/server-renderer'
import { useNuxtApp } from '#app'
import { useRouteCache } from '../composables/useRouteCache'
import { getMultiCacheContext } from './../helpers/server'

/**
 * Check if something is a promise.
 */
function isPromise(p: any) {
  if (typeof p === 'object' && typeof p.then === 'function') {
    return true
  }

  return false
}

/**
 * Unrolls (flattens) the buffer array.
 *
 * Copied from vue/server-renderer.
 */
async function unrollBuffer(buffer: any[]) {
  let ret = ''
  for (let i = 0; i < buffer.length; i++) {
    let item = buffer[i]
    if (isPromise(item)) {
      item = await item
    }
    if (typeof item === 'string') {
      ret += item
    } else {
      ret += await unrollBuffer(item)
    }
  }
  return ret
}

/**
 * Wrapper for cacheable components.
 *
 * The component is cached based on the props of the first child in the
 * default slot. Alternatively you can provide a custom cache key.
 *
 * The slot can only have a single child. That means you would have to wrap it
 * in a <div>, but you likely want to create a component that "groups" together
 * all your other components.
 *
 * On the server the contents of the default slot will be cached in Nitro's
 * storage as markup. After that rendering is skipped and the markup is directly
 * rendered. This means that the entire tree of the slot must not produce any
 * side effects and must not access any form of global state:
 *
 * - Using any form of global state (Pinia, vue-router, session, cookie, auth)
 *   won't work and can lead to unexpected (and dangerous) behavior. This is
 *   also true for provide/inject (unless it's a helper/instance of some sort).
 * - All data must be provided using props. That way it's possible to generate a
 *   unique cache key that changes when the props are different.
 * - For example in a multi-lingual setup you would need to pass the "current
 *   language" as a prop and take it into account for the cache key if your
 *   component uses i18n. And if you don't render user information directly,
 *   you could cache components based on wether the request is authenticated
 *   or not.
 *
 * In addition to the markup it will also cache payloads produced by the
 * component (e.g. via useAsyncData). It is advisable though to not fetch any
 * data in cached components but instead pass it in via props and cache this
 * data via a separate cache.
 */
export default defineComponent({
  name: 'RenderCacheable',

  props: {
    /**
     * The tag to use for the wrapper. It's unfortunately not possible to
     * implement this without a wrapper.
     */
    tag: {
      type: String,
      default: 'div',
    },

    /**
     * The key to use for the cache entry. If left empty a key is automatically
     * generated based on the props passed to the child.
     */
    cacheKey: {
      type: String,
      default: '',
    },

    /**
     * Cache tags that can be later used for invalidation.
     */
    cacheTags: {
      type: Array,
      default: () => [],
    },
  },
  async setup(props: any) {
    // Extract the contents of the default slot.
    const slots = useSlots()
    if (!slots.default) {
      return
    }

    // Early return when there is nothing to render.
    const defaultSlot = slots.default()
    const first = defaultSlot[0]
    if (!first) {
      return
    }

    // Wrap all server-side code in an if statement so that it gets properly
    // removed from the client bundles.
    if (process.server) {
      const cacheKeyBase = props.cacheKey || JSON.stringify(first.props || {})
      if (!cacheKeyBase) {
        return
      }
      const componentName =
        typeof first.type === 'object' && '__name' in first.type
          ? first.type.__name
          : ''
      const cacheKey = componentName + '::' + cacheKeyBase

      // Get the current instance and check if a parent is available. Its
      // parent is the parent of the slot components.
      // A parent is required for the ssrRenderSlotInner call.
      const currentInstance = getCurrentInstance()

      // Method to get the cached version of a component.
      // If it doesn't exist, it will be rendered to a string and then stored
      // in the cache.
      const getOrCreateCachedComponent = async (): Promise<
        string | undefined
      > => {
        // Skip caching if neither component name nor cache key is available.
        if (!componentName && !cacheKeyBase) {
          console.debug(
            `Skipped caching component because either component name or cache key must be provided.`,
          )
          return
        }

        // SSR context should exist at this point, but TS doesn't know that.
        const ssrContext = useSSRContext()
        if (!ssrContext) {
          return
        }

        // Get the cache storage. If the module is disabled this will be
        // undefined.
        const multiCache = getMultiCacheContext(ssrContext.event)
        if (!multiCache || !multiCache.component) {
          return
        }

        const nuxtApp = useNuxtApp()

        // Get the cached item from the storage.
        const cached = await multiCache.component.getItem(cacheKey)

        if (cached) {
          // Component cached together with payload. Nitro has already parsed the
          // JSON for us.
          if (typeof cached === 'object' && 'markup' in cached) {
            const { markup, payload, cacheTags } = cached as any
            // If payload is available it will be appended to the payload of this response.
            if (payload) {
              Object.keys(payload).forEach((key) => {
                nuxtApp.payload.data[key] = payload[key]
              })
            }

            // Make sure the cache tags of this component get added to the
            // cache tags for the route.
            if (cacheTags && cacheTags.length) {
              const routeContext = useRouteCache()
              routeContext.addTags(cacheTags)
            }
            return markup
          } else if (typeof cached === 'string') {
            // Only component markup cached as string.
            return cached
          }
        }

        if (!currentInstance) {
          console.log('Failed to get current instance in Cacheable component.')
          return
        }
        if (!currentInstance.parent) {
          console.log('Failed to get parent component in Cacheable component.')
          return
        }

        // Helper method to get all the payload data keys.
        const getPayloadKeys = (): string[] => {
          return Object.keys(nuxtApp.payload.data || {})
        }

        // Payload keys before rendering the slot.
        const payloadBefore = getPayloadKeys()

        // Set up buffer and push method. Ideally we could use
        // vue/server-renderer's "createBuffer" method, but unfortunately it
        // isn't exported.
        const buffer: any[] = []
        const push = (v: any) => {
          buffer.push(v)
        }

        // Render the contents of the default slot. We pass in the push method
        // that will mutate our buffer array and add items to it.
        ssrRenderSlotInner(
          // Slots of this wrapper component.
          slots,
          // Chose the default slot.
          'default',
          // Slot props are not supported.
          {},
          // No fallback render function.
          null,
          // Method that pushes markup fragments or promises to our buffer.
          push,
          // This wrapper component's parent.
          currentInstance.parent,
        )

        // The buffer now contains a nested array of strings or promises. This
        // method flattens the array down to a single string.
        const markup = await unrollBuffer(buffer)

        // Find out if new payload was added.
        // This has a big flaw though: If the component depends on a payload
        // that another component produced before, it will not show up here, as
        // Nuxt has already reused the data from before. This means the
        // component is now dependent on another component and won't have its
        // data cached along with it. This will trigger a request on the client
        // side to get the data if the dependent component is rendered alone.
        const newPayloadKeys = getPayloadKeys().filter(
          (v) => !payloadBefore.includes(v),
        )

        // Storing the markup in cache is wrapped in a try/catch. That way if
        // the cache backend is down for some reason we can still return the
        // markup already generated.
        try {
          // The cache tags for this component.
          const cacheTags = props.cacheTags || []
          // We have payload or cache tags.
          if (newPayloadKeys.length || cacheTags.length) {
            // Extract the payload relevant to the component.
            const payload: Record<string, any> = newPayloadKeys.reduce<
              Record<string, string>
            >((acc, key) => {
              acc[key] = nuxtApp.payload.data[key]
              return acc
            }, {})

            // Store the markup + payload in the cache.
            multiCache.component.setItem(
              cacheKey,
              JSON.stringify({ payload, markup, cacheTags }),
            )
          } else {
            // Only store the markup in cache.
            multiCache.component.setItem(cacheKey, markup)
          }
        } catch (e) {
          console.debug(e)
        }

        // Return the stringified slot content as innerHTML.
        return markup
      }

      // Try to get a cached version of the child.
      // We wrap it in a try/catch so that in case something goes wrong (e.g.
      // storage driver backend [redis] down) we fall back to render it again.
      try {
        const cachedMarkup = await getOrCreateCachedComponent()
        if (cachedMarkup) {
          return () =>
            h(props.tag, {
              innerHTML: cachedMarkup,
              'data-cacheable-key': cacheKey,
            })
        }
      } catch (e) {
        console.debug(e)
      }
    }

    // Fallback behavior: Return the default slot.
    // This is also what will end up in the client bundles (default Vue
    // behavior).
    return () => h(props.tag, slots.default!())
  },
})
