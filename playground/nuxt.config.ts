import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  routeRules: {
    '/spaPageWithCachedComponent': { ssr: false },
    '/spaDataCache': { ssr: false },
    '/spaPageWithException': { ssr: false },
    '/api/routeCacheWithRouteRules': {
      headers: {
        'x-route-rules-header': 'Set via routeRules',
      },
    },
    '/api/testStaleIfError': {
      headers: {
        'x-route-rules-header': 'Set via routeRules',
      },
    },
  },
  modules: [NuxtMultiCache],
  imports: {
    autoImport: false,
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

  css: ['vue-json-pretty/lib/styles.css'],
})
