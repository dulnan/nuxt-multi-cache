import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

// Built for Cloudflare Workers and run in workerd by Miniflare.
export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    route: {
      enabled: true,
    },
    component: {
      enabled: true,
    },
    data: {
      enabled: true,
    },
    api: {
      enabled: true,
      authorization: false,
      // Workers don't run timers after the response has been sent.
      cacheTagInvalidationDelay: 0,
    },
  },

  nitro: {
    preset: 'cloudflare_module',
  },

  compatibilityDate: '2025-04-27',
})
