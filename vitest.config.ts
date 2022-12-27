import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // include: ['test/**/*.test.ts'],
    coverage: {
      all: true,
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.*'],
    },
  },
})
