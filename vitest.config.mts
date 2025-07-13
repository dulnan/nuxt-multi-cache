import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['./test/**/*.spec.ts'],
    coverage: {
      all: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.*'],
    },
    // environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        overrides: {
          modules: ['nuxt-multi-cache'],
          multiCache: {
            component: {
              enabled: true
            },
            route: {
              enabled: true,
            },
            data: {
              enabled: true,
            },
            cdn: {
              enabled: true
            },
            disableCacheOverviewLogMessage: true
          }
        },
      },
    },
  },
})
