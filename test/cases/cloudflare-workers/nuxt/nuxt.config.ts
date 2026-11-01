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
    // The cache tag invalidation delay is 0 for Cloudflare presets.
    api: {
      enabled: true,
      authorization: false,
    },
  },

  nitro: {
    preset: 'cloudflare_module',
  },

  compatibilityDate: '2025-04-27',
})
