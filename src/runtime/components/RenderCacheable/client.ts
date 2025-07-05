import { defineComponent, h } from 'vue'
import type { Props } from './helpers'

/**
 * Client-side component for <RenderCacheable>.
 */
export default defineComponent<Props>({
  name: 'RenderCacheable',

  props: {
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

    asyncDataKeys: {
      type: Array,
    },
  },
  setup(props, { slots }) {
    const tag = props.tag ?? 'div'
    const defaultSlot = slots.default

    if (!defaultSlot) {
      return () => h(tag, '')
    }

    return () => h(tag, defaultSlot())
  },
})
