import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  imports: {
    autoImport: true,
  },

  multiCache: {
    debug: true,
    component: {
      enabled: true,
    },
    route: {
      enabled: true,
    },

    data: {
      enabled: true,
    },

    cdn: {
      enabled: true,
    },
    api: {
      enabled: true,
      cacheTagInvalidationDelay: 5000,
      authorization: false,
    },
  },

  compatibilityDate: '2024-10-19',

  future: {
    compatibilityVersion: 3,
  },
})
