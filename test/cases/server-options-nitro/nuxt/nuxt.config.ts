import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  runtimeConfig: {
    cacheKeyPrefix: 'from-runtime-config',
  },

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

  experimental: {
    // The default with future.compatibilityVersion 5: Nitro's #imports only
    // contains the imports added by modules.
    nitroAutoImports: false,
  },

  compatibilityDate: '2025-04-27',
})
