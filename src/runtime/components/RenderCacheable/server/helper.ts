import { hash } from 'ohash'
import type { Storage } from 'unstorage'
import { ssrRenderSlotInner } from 'vue/server-renderer'
import {
  Fragment,
  type VNode,
  type RendererNode,
  type RendererElement,
  type Slots,
  type ComponentInternalInstance,
} from 'vue'
import {
  decodeComponentCacheItem,
  handleRawCacheData,
} from '../../../helpers/cacheItem'
import { logger } from '../../../helpers/multi-cache-logger'
import type { ComponentCacheItem } from './../../../types'
import { debug } from '#nuxt-multi-cache/config'
import type { Props } from '../shared'

export type RenderCacheableSlotVNode = VNode<
  RendererNode,
  RendererElement,
  { [key: string]: any }
>

/**
 * Whether the component of the vnode receives content in its slots.
 */
function hasSlotContent(vnode: VNode): boolean {
  return (
    typeof vnode.type === 'object' &&
    typeof vnode.children === 'object' &&
    vnode.children !== null &&
    !Array.isArray(vnode.children)
  )
}

/**
 * Get the vnode of the slot that is used to build the cache key.
 *
 * This is the first vnode of the slot. A slot forwarded by a wrapper component
 * (`<slot />`) is a fragment, so its first child is used instead, but only if
 * a cache key is provided: The wrapper can't know what is passed into its
 * slot. For example, the slot of a layout contains <NuxtPage>, which has no
 * props, so every page would get the same key.
 *
 * For the same reason, a component that receives slot content is only cached
 * with a cache key: The generated key only contains its props, while the slot
 * content can be different for every request. An empty cache key explicitly
 * uses the same key for all instances.
 */
export function getSlotVNode(
  props: Props,
  vnodes: VNode[],
): RenderCacheableSlotVNode | undefined {
  const first = vnodes[0]
  if (first?.type !== Fragment) {
    if (
      first &&
      hasSlotContent(first) &&
      (props.cacheKey === undefined || props.cacheKey === null)
    ) {
      if (debug) {
        logger.info(
          'Skipped caching component with slot content because no cache key is provided.',
          { props },
        )
      }
      return
    }

    return first
  }

  if (!props.cacheKey) {
    if (debug) {
      logger.info(
        'Skipped caching forwarded slot because no cache key is provided.',
        { props },
      )
    }
    return
  }

  if (Array.isArray(first.children)) {
    return getSlotVNode(props, first.children as VNode[])
  }
}

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
  const cacheKeyBase = props.cacheKey ?? (hasProps ? hash(vnode.props) : '')

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

    throw e
  }
}

/**
 * A set that also adds its values to another set.
 */
class ForwardingSet<T> extends Set<T> {
  constructor(private readonly getTarget: () => Set<T>) {
    super()
  }

  override add(value: T): this {
    this.getTarget().add(value)
    return super.add(value)
  }
}

/**
 * Create the SSR context for the slot of a <RenderCacheable>.
 *
 * Components add the ID of their module to the `modules` set of the SSR
 * context they inject (via useSSRContext()). Nuxt uses the modules to render
 * the styles and preload links of the page. The scoped context collects the
 * modules rendered in the slot, so that they can be stored with the markup.
 * Unlike replacing the set of the shared context, this also works when
 * several instances render at the same time.
 *
 * The modules are also added to the parent context: The context of the
 * request, or the scoped context of an outer <RenderCacheable>.
 */
export function createScopedSsrContext(parent: Record<string, any>): {
  context: Record<string, any>
  modules: Set<string>
} {
  const modules = new ForwardingSet<string>(
    () => (parent.modules ||= new Set()),
  )

  // All other properties are read from and written to the parent context.
  const context = new Proxy(parent, {
    get(target, key) {
      if (key === 'modules') {
        return modules
      }

      return Reflect.get(target, key)
    },
  })

  return { context, modules }
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
