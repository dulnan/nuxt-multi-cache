import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../src/module'

export default defineNuxtConfig({
  routeRules: {
    '/spaPageWithCachedComponent': { ssr: false },
    '/spaDataCache': { ssr: false },
    '/spaPageWithException': { ssr: false },
    '/nitro-swr': { swr: 3 },
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

  modules: [NuxtMultiCache, '@nuxt/eslint'],

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

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
      },
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  css: ['vue-json-pretty/lib/styles.css'],
  compatibilityDate: '2024-10-18',

  vite: {
    build: {
      minify: false,
    },
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
})
