import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // include: ['test/**/*.test.ts'],
    coverage: {
      all: true,
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.*'],
    },
  },
})
