import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['./test/**/*.spec.ts'],
    environment: 'nuxt',
    // coverage: {
    //   all: true,
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   include: ['src/**/*.*'],
    //   exclude: ['src/runtime/types.ts'],
    // },
  },
  // resolve: {
  //   alias: {
  //     '#multi-cache-server-options': path.resolve(__dirname, './playground/.nuxt/multiCache.serverOptions.ts'),
  //   },
  // },
})
