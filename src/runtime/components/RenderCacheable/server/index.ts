import {
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  onErrorCaptured,
  ssrContextKey,
} from 'vue'
import { useNuxtApp } from '#app'
import { provide } from '#imports'
import { encodeComponentCacheItem } from '../../../helpers/cacheItem'
import { logger } from '../../../helpers/multi-cache-logger'
import {
  getMultiCacheContext,
  getCacheKeyWithPrefix,
  isValidCacheKey,
  enabledForRequest,
  getRequestTimestamp,
  getCacheTagRegistry,
} from './../../../helpers/server'
import {
  createScopedSsrContext,
  getCacheKey,
  getCachedComponent,
  getSlotVNode,
  renderSlot,
} from './helper'
import { type Props, props } from '../shared'
import { debug } from '#nuxt-multi-cache/config'
import {
  ComponentCacheHelper,
  INJECT_COMPONENT_CACHE_CONTEXT,
} from '../../../helpers/ComponentCacheHelper'
import {
  CACHE_NEVER,
  CACHE_PERMANENT,
  getStorageTtl,
  isExpired,
} from '../../../helpers/maxAge'
import type { ComponentCacheItem } from '../../../types'
import { bubbleCacheability } from './../../../helpers/bubbleCacheability'

/**
 * Wrapper for cacheable components.
 *
 * The component is cached based on the props of the first child in the
 * default slot. Alternatively you can provide a custom cache key, which is
 * required if the child receives slot content.
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

    // The context of an enclosing <RenderCacheable>. Its cached markup
    // contains the markup of this instance, so the cacheability of this
    // instance is always merged into it. inject() reads from the parent, so
    // this is not the context provided below.
    const parentContext = inject<{ helper?: ComponentCacheHelper } | null>(
      INJECT_COMPONENT_CACHE_CONTEXT,
      null,
    )

    if (props.noCache) {
      parentContext?.helper?.setUncacheable()
      return renderFallback
    }

    const first = getSlotVNode(props, defaultSlot)

    if (!first) {
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

    // Components in the slot add their module to the SSR context they inject.
    // A scoped context collects the modules of this instance. Like the
    // provide() above, this must happen before the first await.
    const parentSsrContext = inject<Record<string, any> | null>(
      ssrContextKey,
      null,
    )
    const scopedSsrContext = parentSsrContext
      ? createScopedSsrContext(parentSsrContext)
      : null
    if (scopedSsrContext) {
      provide(ssrContextKey, scopedSsrContext.context)
    }

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
    if (!isValidCacheKey(fullCacheKey, 'component')) {
      return renderFallback
    }

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

      // Add the modules to the parent context: The context of the request,
      // or of an outer <RenderCacheable> that stores them too.
      if (cacheItem.ssrModules && parentSsrContext) {
        const modules: Set<string> = (parentSsrContext.modules ||= new Set())
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

      parentContext?.helper?.mergeFromCacheItem(cacheItem)
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

    // The modules rendered in the slot.
    const ssrModules = scopedSsrContext ? [...scopedSsrContext.modules] : []

    parentContext?.helper?.mergeFromCacheability(helper)
    bubbleCacheability(helper, event, props.bubbleCacheability)

    const expires = helper.getExpires('maxAge') ?? CACHE_PERMANENT
    const staleIfErrorExpires = helper.getExpires('staleIfError') ?? CACHE_NEVER
    const ttl = getStorageTtl({ expires, staleIfErrorExpires }, now)

    // Not cacheable, or can never be served from cache (e.g. a max age of 0
    // without stale-if-error), return.
    if (!helper.isCacheable() || ttl === CACHE_NEVER) {
      return renderMarkup(renderResult)
    }

    // Storing the markup in cache is wrapped in a try/catch. That way if
    // the cache backend is down for some reason we can still return the
    // markup already generated.
    try {
      // The cache tags for this component.
      const cacheTags = helper.tags

      // Extract the payload relevant to the component.
      const payload: Record<string, any> = helper.payloadKeys.reduce<
        Record<string, string>
      >((acc, key) => {
        acc[key] = nuxtApp.payload.data[key]
        return acc
      }, {})

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
        { ttl },
      )
      if (cacheTags.length) {
        const registry = getCacheTagRegistry(event)
        if (registry) {
          await registry.addCacheTags(fullCacheKey, 'component', cacheTags)
        }
      }
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
