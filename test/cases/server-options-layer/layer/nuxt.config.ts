import { defineNuxtConfig } from 'nuxt/config'
import NuxtMultiCache from './../../../../src/module'

// A layer that installs the module and provides the server options.
export default defineNuxtConfig({
  modules: [NuxtMultiCache],

  multiCache: {
    route: {
      enabled: true,
    },
    api: {
      enabled: true,
      authorization: false,
    },
  },
})
