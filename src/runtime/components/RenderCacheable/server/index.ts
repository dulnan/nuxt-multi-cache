import { defineComponent, getCurrentInstance, h, onErrorCaptured } from 'vue'
import { useNuxtApp } from '#app'
import { provide } from '#imports'
import { encodeComponentCacheItem } from '../../../helpers/cacheItem'
import { logger } from '../../../helpers/logger'
import {
  getMultiCacheContext,
  getCacheKeyWithPrefix,
  enabledForRequest,
  getRequestTimestamp,
} from './../../../helpers/server'
import { getCacheKey, getCachedComponent, renderSlot } from './helper'
import { type Props, props } from '../shared'
import { debug } from '#nuxt-multi-cache/config'
import {
  ComponentCacheHelper,
  INJECT_COMPONENT_CACHE_CONTEXT,
} from '../../../helpers/ComponentCacheHelper'
import { isExpired } from '../../../helpers/maxAge'
import type { ComponentCacheItem } from '../../../types'
import { bubbleCacheability } from './../../../helpers/bubbleCacheability'

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
export default defineComponent<Props>({
  name: 'RenderCacheable',
  props,
  async setup(props, { slots }) {
    const tag = props.tag ?? 'div'

    if (!slots.default) {
      return () =>
        h(tag, {
          innerHTML: '',
        })
    }

    const defaultSlot = slots.default()
    const renderFallback = () => h(tag, defaultSlot)

    const first = defaultSlot[0]

    if (props.noCache || !first) {
      return renderFallback
    }

    const nuxtApp = useNuxtApp()

    // We have to call provide() before the first await or else it will not
    // work. To prevent always creating a ComponentCacheHelper instance, even
    // if not needed, we provide an empty object instead and create the helper
    // later and assign it to the helper property.
    const providedContext: { helper?: ComponentCacheHelper } = {
      helper: undefined,
    }

    // Injected by useComponentCache().
    provide(INJECT_COMPONENT_CACHE_CONTEXT, providedContext)

    const ssrContext = nuxtApp.ssrContext

    if (!ssrContext) {
      if (debug) {
        logger.warn('Failed to get SSR context.', props)
      }
      return renderFallback
    }

    const cacheKey = getCacheKey(props, first)

    // Return if no cache key found.
    if (!cacheKey) {
      return renderFallback
    }

    // Get the current instance.
    const currentInstance = getCurrentInstance()

    if (!currentInstance) {
      if (debug) {
        logger.warn(
          'Failed to get current instance in RenderCacheable component.',
          props,
        )
      }

      return renderFallback
    }

    const event = ssrContext.event

    const isEnabled = await enabledForRequest(event)
    if (!isEnabled) {
      return renderFallback
    }

    // Get the cache storage. If the module is disabled this will be
    // undefined.
    const componentCache = getMultiCacheContext(event)?.component
    if (!componentCache) {
      return renderFallback
    }

    const bubbleError = componentCache.bubbleError

    const fullCacheKey = await getCacheKeyWithPrefix(cacheKey, event)

    // Get the cached item from the storage.
    const cached = await getCachedComponent(
      componentCache.storage,
      fullCacheKey,
    ).catch((e) => {
      logger.error('Failed to get component cache item.', {
        fullCacheKey,
      })
      if (bubbleError) {
        throw e
      }
    })

    const renderMarkup = (markup: string) => {
      return () =>
        h(tag, {
          innerHTML: markup,
        })
    }

    const now = getRequestTimestamp(event)

    function returnCached(cacheItem: ComponentCacheItem) {
      // If payload is available for component add it to the global payload
      // object.
      if (cacheItem.payload) {
        Object.keys(cacheItem.payload).forEach((key) => {
          nuxtApp.payload.data[key] = cacheItem.payload![key]
        })
      }

      if (cacheItem.ssrModules && nuxtApp.ssrContext?.modules) {
        const modules = nuxtApp.ssrContext.modules
        cacheItem.ssrModules.forEach((mod) => modules.add(mod))
      }

      if (debug) {
        logger.info('Returning cached component.', {
          fullCacheKey,
          payload: cacheItem.payload ? Object.keys(cacheItem.payload) : [],
          expires: cacheItem.expires,
          props,
        })
      }

      bubbleCacheability(cacheItem, event, props.bubbleCacheability)

      return renderMarkup(cacheItem.data)
    }

    if (cached) {
      // Check if the cache entry is expired.
      if (isExpired(cached.expires, now)) {
        if (debug) {
          logger.error(
            "Don't return component from cache because it's expired.",
            {
              fullCacheKey,
              expires: cached.expires,
            },
          )
        }
      } else {
        return returnCached(cached)
      }
    }

    const helper = new ComponentCacheHelper(now)
    providedContext.helper = helper

    // For backwards-compatibility we assume that the component is
    // cacheable by default.
    helper.setCacheable()

    if (props.asyncDataKeys) {
      helper.addPayloadKeys(props.asyncDataKeys)
    }

    if (props.maxAge !== undefined && props.maxAge !== null) {
      helper.setMaxAge(props.maxAge)
    }

    if (props.staleIfError !== undefined && props.staleIfError !== null) {
      helper.setStaleIfError(props.staleIfError)
    }

    if (props.cacheTags) {
      helper.addTags(props.cacheTags)
    }

    // Store the original set.
    const originalModules = ssrContext.modules

    // Override with a new Set, so we can capture all module identifiers
    // that were added during rendering of the entire slot.
    ssrContext.modules = new Set()

    // Capture errors during rendering of the slot.
    let renderError: Error | undefined = undefined

    onErrorCaptured((err) => {
      renderError = err

      // Stop the error from bubbling. We will optionally throw an error later
      // if no stale component can be returned.
      return false
    }, currentInstance)

    // Render the contents of the slot to string.
    const renderResult = await renderSlot(slots, currentInstance)

    if (renderResult instanceof Error || renderError) {
      if (cached) {
        const canReturnStale = !isExpired(
          cached.staleIfErrorExpires,
          getRequestTimestamp(event),
        )
        if (canReturnStale) {
          return returnCached(cached)
        }
      }

      // Re-throw error. Note we ignore bubbleError here, because it's not an
      // error related to a nuxt-multi-cache issue.
      if (renderError) {
        throw renderError
      } else if (renderResult instanceof Error) {
        throw renderResult
      }
    }

    const ssrModules = [...ssrContext.modules.values()]

    if (originalModules) {
      ssrModules.forEach((id) => originalModules.add(id))
    }

    // Restore the original set.
    ssrContext.modules = originalModules

    bubbleCacheability(helper, event, props.bubbleCacheability)

    // Not cacheable, return.
    if (!helper.isCacheable()) {
      return renderMarkup(renderResult)
    }

    // Storing the markup in cache is wrapped in a try/catch. That way if
    // the cache backend is down for some reason we can still return the
    // markup already generated.
    try {
      // The cache tags for this component.
      const cacheTags = helper.tags

      const maxAge = helper.maxAge

      // Extract the payload relevant to the component.
      const payload: Record<string, any> = helper.payloadKeys.reduce<
        Record<string, string>
      >((acc, key) => {
        acc[key] = nuxtApp.payload.data[key]
        return acc
      }, {})

      const expires = helper.getExpires('maxAge')
      const staleIfErrorExpires = helper.getExpires('staleIfError')

      // Store in cache.
      await componentCache.storage.setItemRaw(
        fullCacheKey,
        encodeComponentCacheItem(
          renderResult,
          payload,
          expires,
          cacheTags,
          ssrModules,
          staleIfErrorExpires,
        ),
        { ttl: maxAge },
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
      logger.error(
        'Failed to store component in cache.',
        {
          fullCacheKey,
          props,
        },
        e,
      )
      if (bubbleError) {
        throw e
      }
    }

    return renderMarkup(renderResult)
  },
})
