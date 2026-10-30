import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  // The API and the build assets are served below the base URL.
  app: {
    baseURL: '/shop/',
  },

  multiCache: {
    route: {
      enabled: true,
    },
    api: {
      enabled: true,
      authorization: 'hunter2',
    },
  },

  compatibilityDate: '2025-04-27',
})
