import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  routeRules: {
    '/spaPageWithCachedComponent': { ssr: false },
    '/spaDataCache': { ssr: false },
    '/spaPageWithException': { ssr: false },
  },
  modules: [NuxtMultiCache],
  multiCache: {
    debug: false,
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
})
