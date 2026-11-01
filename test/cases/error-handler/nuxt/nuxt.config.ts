import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    route: {
      enabled: true,
      cacheStatus: true,
    },
    api: {
      enabled: true,
      authorization: false,
    },
    // Allows overriding the current time via a request header.
    enableTestMode: true,
  },

  routeRules: {
    // Nitro's own cache, in front of the page's rendering.
    '/nitro-cached': { swr: 600 },
  },

  compatibilityDate: '2025-04-27',
})
