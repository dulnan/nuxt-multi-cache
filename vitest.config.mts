import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['./test/**/*.spec.ts'],
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
            }
          }
        },
      },
    },
  },
})
