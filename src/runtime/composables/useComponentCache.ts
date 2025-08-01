import { isServer } from '#nuxt-multi-cache/config'
import { inject } from '#imports'
import {
  INJECT_COMPONENT_CACHE_CONTEXT,
  type ComponentCacheHelper,
} from '../helpers/ComponentCacheHelper'

/**
 * Use the component cache helper to dynamically set cacheability of
 * components.
 *
 * This composable can only be used in components that are rendered inside
 * <RenderCacheable>.
 *
 * If this is not the case, the callback is never called and the composable
 * has no effect.
 */
export function useComponentCache(
  cb: (helper: ComponentCacheHelper) => void,
): void {
  if (!isServer) {
    return
  }

  const ctx = inject<{ helper?: ComponentCacheHelper } | null>(
    INJECT_COMPONENT_CACHE_CONTEXT,
    null,
  )

  if (!ctx?.helper) {
    return
  }

  cb(ctx.helper)
}
