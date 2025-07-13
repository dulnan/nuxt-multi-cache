export default defineNuxtConfig({
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
