import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import path from 'path'

const alias: Record<string, string> = {
  '~': path.resolve(__dirname),
  '#nuxt-multi-cache/config': path.resolve(
    __dirname,
    './.nuxt/nuxt-multi-cache/config.js',
  ),
  '#nuxt-multi-cache/server-options': path.resolve(
    __dirname,
    './.nuxt/nuxt-multi-cache/server-options.js',
  ),
  '#imports': path.resolve(__dirname, './.nuxt/imports.mjs'),
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/**/*.{e2e,node}.spec.ts'],
          environment: 'node',
          alias,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/**/*.nuxt.spec.ts'],
          environment: 'nuxt',
          alias,
        },
      }),
    ],
  },
})
