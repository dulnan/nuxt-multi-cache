import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    debug: true,
    component: {
      enabled: true,
    },
    api: {
      enabled: true,
      cacheTagInvalidationDelay: 5000,
      authorization: false,
    },
  },

  compatibilityDate: '2025-04-27',

  features: {
    inlineStyles: true,
  },

  vite: {
    plugins: [cssInjectedByJsPlugin()],
  },
})
