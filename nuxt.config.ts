export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],
  multiCache: {
    component: {
      enabled: true,
    },
    data: {
      enabled: true,
    },
    route: {
      enabled: true,
    },
    cdn: {
      enabled: true,
    },
  },
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true,
      },
      exclude: ['../playground', '../playground-minimal', '../dist'],
    },
  },
})
