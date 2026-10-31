import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    route: {
      enabled: true,
    },
    // No token: The authorization callback from the server options is used.
    api: {
      enabled: true,
    },
  },

  compatibilityDate: '2025-04-27',
})
