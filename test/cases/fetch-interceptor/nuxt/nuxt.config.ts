import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  routeRules: {},

  multiCache: {
    debug: true,
    route: {
      enabled: true,
    },
    cdn: {
      enabled: true,
    },
    data: {
      enabled: true,
    },
    api: {
      enabled: true,
      cacheTagInvalidationDelay: 5000,
      authorization: false,
    },
  },

  compatibilityDate: '2025-04-27',
})
