import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],
  multiCache: {
    route: {
      enabled: true,
    },
    component: {
      enabled: true,
    },
    api: {
      enabled: true,
      cacheTagInvalidationDelay: 5000,
      authorization: false,
    },
  },
})
