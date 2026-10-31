import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    route: {
      enabled: true,
    },
    data: {
      enabled: true,
    },
    api: {
      enabled: true,
      authorization: false,
    },
  },

  compatibilityDate: '2025-04-27',
})
