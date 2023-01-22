import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],
  multiCache: {
    component: {
      enabled: true,
      storage: {},
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
})
