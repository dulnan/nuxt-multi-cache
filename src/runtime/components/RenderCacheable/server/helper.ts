import { hash } from 'ohash'
import type { Storage } from 'unstorage'
import { ssrRenderSlotInner } from 'vue/server-renderer'
import type {
  VNode,
  RendererNode,
  RendererElement,
  Slots,
  ComponentInternalInstance,
} from 'vue'
import {
  decodeComponentCacheItem,
  handleRawCacheData,
} from '../../../helpers/cacheItem'
import { logger } from '../../../helpers/logger'
import type { ComponentCacheItem } from './../../../types'
import { debug } from '#nuxt-multi-cache/config'
import type { Props } from '../shared'

export type RenderCacheableSlotVNode = VNode<
  RendererNode,
  RendererElement,
  { [key: string]: any }
>

/**
 * Build the cache key.
 *
 * A custom key is used if provided. If not, a key is generated based on the
 * props of the given vnode. If no props are available or if the component has
 * no name, return.
 */
export function getCacheKey(
  props: Props,
  vnode: RenderCacheableSlotVNode,
): string | undefined {
  const componentName = getComponentName(vnode)
  const hasProps = Object.keys(vnode.props || {}).length > 0
  const cacheKeyBase = props.cacheKey || (hasProps ? hash(vnode.props) : '')

  if (!componentName) {
    if (debug) {
      logger.info('Skipped caching component because component has no name.', {
        props,
      })
    }
    return
  }

  if (cacheKeyBase) {
    return `${componentName}::${cacheKeyBase}`
  }

  return componentName
}

export function getComponentName(
  vnode: RenderCacheableSlotVNode,
): string | undefined {
  if (typeof vnode.type === 'object') {
    if ('__name' in vnode.type) {
      return vnode.type.__name
    } else if ('name' in vnode.type) {
      return vnode.type.name
    }
  }
}

/* c8 ignore start */
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
/* c8 ignore stop */

/**
 * Render the contents of a slot and return the markup.
 *
 * This is approximately the same behavior as in vue/server-renderer. The
 * ssrRenderSlotInner pushes the rendered fragments of the entire tree in the
 * buffer array. Then the unrollBuffer method is called which merges the
 * nested array into a single string of markup.
 */
export function renderSlot(
  slots: Slots,
  parent: ComponentInternalInstance,
): Promise<string | Error> {
  try {
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
      parent,
    )

    // The buffer now contains a nested array of strings or promises. This
    // method flattens the array down to a single string.
    return unrollBuffer(buffer)
  } catch (e) {
    if (e instanceof Error) {
      return Promise.resolve(e)
    }

    throw new Error('Unexpected error.')
  }
}

/**
 * Check the cache for an already rendered component. If available, return the
 * data.
 */
export async function getCachedComponent(
  storage: Storage,
  cacheKey: string,
): Promise<ComponentCacheItem | undefined> {
  // Get the cached item from the storage.
  const cachedRaw = handleRawCacheData(
    await storage.getItemRaw<string>(cacheKey),
  )

  if (cachedRaw) {
    return decodeComponentCacheItem(cachedRaw)
  }
}
