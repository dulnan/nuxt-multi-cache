import { isServer } from '#nuxt-multi-cache/config'
import { inject } from '#imports'
import {
  INJECT_COMPONENT_CACHE_CONTEXT,
  type ComponentCacheHelper,
} from '../helpers/ComponentCacheHelper'

/**
 * Use the component cache helper.
 *
 * This composable should only be used in components that are rendered inside
 * <RenderCacheable>.
 *
 * If this is not the case, the callback is never called.
 */
export function useComponentCache(
  cb: (helper: ComponentCacheHelper) => void,
): void {
  if (!isServer) {
    return
  }

  const helper = inject<ComponentCacheHelper | null>(
    INJECT_COMPONENT_CACHE_CONTEXT,
    null,
  )

  if (!helper) {
    return
  }

  cb(helper)
}
