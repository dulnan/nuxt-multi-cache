import {
  defineComponent,
  useSSRContext,
  useSlots,
  getCurrentInstance,
  h,
} from 'vue'
import type { PropType } from 'vue'
import { useNuxtApp } from '#app'
import { encodeComponentCacheItem } from '../../helpers/cacheItem'
import { logger } from '../../helpers/logger'
import {
  getExpiresValue,
  getMultiCacheContext,
  getCacheKeyWithPrefix,
} from './../../helpers/server'
import { getCacheKey, getCachedComponent, renderSlot } from './helpers'
import { useRuntimeConfig } from '#imports'

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
 * - Using or changing any form of global state (Pinia, vue-router, session,
 *   cookie, auth, meta) won't work and can lead to unexpected (and dangerous)
 *   behavior. This is also true for provide/inject (unless it's a
 *   helper/instance of some sort).
 * - All data must be provided using props. That way it's possible to generate a
 *   unique cache key that changes when the props are different.
 * - For example in a multi-lingual setup you would need to pass the "current
 *   language" as a prop and take it into account for the cache key if your
 *   component uses i18n. And if you don't render user information directly,
 *   you could cache components based on wether the request is authenticated
 *   or not.
 *
 * In addition to the markup it will also cache payloads produced by the
 * component (e.g. via useAsyncData) if the keys are provided. It is advisable
 * though to not fetch any data in cached components but instead pass it in
 * via props and cache this data via a separate cache.
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
     * Disable caching entirely for this component.
     */
    noCache: {
      type: Boolean,
      default: false,
    },

    /**
     * The key to use for the cache entry. If left empty a key is automatically
     * generated based on the props passed to the child.
     * The key is automatically prefixed by the component name.
     */
    cacheKey: {
      type: String,
      default: '',
    },

    /**
     * Cache tags that can be later used for invalidation.
     */
    cacheTags: {
      type: Array as PropType<string[]>,
      default: () => [],
    },

    /**
     * Define a max age for the cached entry.
     */
    maxAge: {
      type: Number,
      default: 0,
    },

    /**
     * Provide the async data keys used by the cached component.
     *
     * If provided the payload data will be cached alongside the component.
     * If the component uses asyncData and the keys are not provided you will
     * receive a hydration mismatch error in the client.
     */
    asyncDataKeys: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  async setup(props) {
    // Extract the contents of the default slot.
    const slots = useSlots()
    if (!slots.default) {
      return () => ''
    }

    const defaultSlot = slots.default()
    const first = defaultSlot[0]

    const isServer = import.meta.server || import.meta.env.VITEST

    // Wrap all server-side code in an if statement so that it gets properly
    // removed from the client bundles.
    if (isServer && !props.noCache) {
      const { debug } = useRuntimeConfig().multiCache || {}
      const cacheKey = getCacheKey(props as any, first as any, debug)

      // Return if no cache key found.
      if (!cacheKey) {
        return () => h(props.tag, slots.default!())
      }

      // Get the current instance.
      const currentInstance = getCurrentInstance()

      const ssrContext = useSSRContext()
      // SSR context should exist at this point, but TS doesn't know that.
      if (!ssrContext) {
        if (debug) {
          logger.warn('Failed to get SSR context.', props)
        }
        return () => h(props.tag, slots.default!())
      }

      // Method to get the cached version of a component.
      // If it doesn't exist, it will be rendered to a string and then stored
      // in the cache.
      const getOrCreateCachedComponent = async (): Promise<
        string | undefined
      > => {
        // A parent component is required when calling the ssrRenderSlotInner
        // method.
        if (!currentInstance?.parent) {
          if (debug) {
            logger.warn(
              'Failed to get parent component in Cacheable component.',
              props,
            )
          }
          return
        }

        // Get Nuxt app.
        const nuxtApp = useNuxtApp()

        // Get the cache storage. If the module is disabled this will be
        // undefined.
        const multiCache = getMultiCacheContext(ssrContext.event)
        if (!multiCache?.component) {
          return
        }

        const fullCacheKey = getCacheKeyWithPrefix(cacheKey, ssrContext.event)

        // Get the cached item from the storage.
        const cached = await getCachedComponent(
          multiCache.component,
          fullCacheKey,
        )

        if (cached) {
          const { data, payload, expires } = cached

          // Check if the cache entry is expired.
          if (expires) {
            const now = Date.now() / 1000
            if (now >= expires) {
              return
            }
          }

          // If payload is available for component add it to the global payload
          // object.
          if (payload) {
            Object.keys(payload).forEach((key) => {
              nuxtApp.payload.data[key] = payload[key]
            })
          }

          if (debug) {
            logger.success('Returning cached component.', {
              fullCacheKey,
              payload: payload ? Object.keys(payload) : [],
              expires,
              props,
            })
          }

          return data
        }

        // Render the contents of the slot to string.
        const data = await renderSlot(slots, currentInstance.parent)

        // Storing the markup in cache is wrapped in a try/catch. That way if
        // the cache backend is down for some reason we can still return the
        // markup already generated.
        try {
          // The cache tags for this component.
          const cacheTags = props.cacheTags

          // Extract the payload relevant to the component.
          const payload: Record<string, any> = props.asyncDataKeys.reduce<
            Record<string, string>
          >((acc, key) => {
            acc[key] = nuxtApp.payload.data[key]
            return acc
          }, {})

          const expires = props.maxAge
            ? getExpiresValue(props.maxAge)
            : undefined

          // Store in cache.
          multiCache.component.setItemRaw(
            fullCacheKey,
            encodeComponentCacheItem(data, payload, expires, cacheTags),
            { ttl: props.maxAge },
          )
          if (debug) {
            logger.log('Stored component in cache.', {
              file: currentInstance.type.__file,
              fullCacheKey,
              expires,
              cacheTags,
            })
          }
        } catch (e) {
          if (debug) {
            logger.error('Failed to store component in cache.', {
              fullCacheKey,
              props,
            })
          }
          if (e instanceof Error) {
            // eslint-disable-next-line no-console
            console.error(e.message)
          }
        }

        // Return the stringified slot content as innerHTML.
        return data
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
            })
        }
      } catch (e) {
        if (debug) {
          logger.error('Failed to get component from cache.', {
            props,
          })
        }
        if (e instanceof Error) {
          // eslint-disable-next-line no-console
          console.error(e.message)
        }
      }
    }

    // Fallback behavior: Return the default slot.
    // This is also what will end up in the client bundles (default Vue
    // behavior).
    return () => h(props.tag, slots.default!())
  },
})
