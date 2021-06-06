import { resolve } from 'path'

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'nuxt-route-cache-test',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    resolve(__dirname, './../lib/esm/index.js'),
    '~/modules/removeAssets.ts',
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},

  multiCache: {
    enabled: true,
    outputDir: '~/cache',
    pageCache: {
      enabled: true,
      mode: 'memory',
    },
    componentCache: {
      enabled: true,
    },
    dataCache: {
      enabled: true,
    },
    server: {
      auth: () => {
        return true
      },
    },
    groupsCache: {
      enabled: true,
    },
    enabledForRequest() {
      return true
    },
  },
}
