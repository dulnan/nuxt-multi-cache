import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    route: {
      enabled: true,
    },
    api: {
      enabled: true,
      authorization: false,
    },
    // Allows overriding the current time via a request header.
    enableTestMode: true,
  },

  compatibilityDate: '2025-04-27',
})
