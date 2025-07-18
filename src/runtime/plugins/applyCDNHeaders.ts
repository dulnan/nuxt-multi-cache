import { defineNuxtPlugin, useCDNHeaders } from '#imports'

/**
 * Applies the CDN headers during SSR.
 */
export default defineNuxtPlugin({
  name: 'nuxt-multi-cache:cdn-headers',
  setup(nuxtApp) {
    nuxtApp.hook('app:rendered', function (ctx) {
      const event = ctx.ssrContext?.event
      if (!event) {
        return
      }

      useCDNHeaders((cdn) => {
        cdn.applyToEvent(event)
      })
    })
  },
})
