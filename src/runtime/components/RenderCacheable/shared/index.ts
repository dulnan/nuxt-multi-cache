import type { MaxAge } from '../../../helpers/maxAge'
import type { BubbleCacheability } from '../../../types'

export type Props = {
  /**
   * The tag to use for the wrapper.
   */
  tag?: string

  /**
   * Disable caching entirely for this component.
   */
  noCache?: boolean

  /**
   * The key to use for the cache entry. If left empty a key is automatically
   * generated based on the props passed to the child.
   *
   * The key is automatically prefixed by the component name.
   */
  cacheKey?: string

  /**
   * Cache tags that can be later used for invalidation.
   */
  cacheTags?: string | string[]

  /**
   * Define a max age for the cached entry.
   */
  maxAge?: MaxAge

  /**
   * Define how lang a stale component can be returned if there is an error
   * during rendering.
   */
  staleIfError?: MaxAge

  /**
   * Provide the async data keys used by the cached component.
   *
   * If provided the payload data will be cached alongside the component.
   * If the component uses asyncData and the keys are not provided you will
   * receive a hydration mismatch error in the client.
   */
  asyncDataKeys?: string | string[]

  /**
   * If cacheability of the component should be bubbled to the route cache and/or CDN headers.
   */
  bubbleCacheability?: BubbleCacheability
}

export const props = {
  tag: {
    type: String,
  },

  noCache: {
    type: Boolean,
  },

  cacheKey: {
    type: String,
  },

  cacheTags: {
    type: [String, Array],
  },

  maxAge: {
    type: [Number, String],
  },

  staleIfError: {
    type: [Number, String],
  },

  asyncDataKeys: {
    type: Array,
  },

  bubbleCacheability: {
    type: [Boolean, String],
  },
}
