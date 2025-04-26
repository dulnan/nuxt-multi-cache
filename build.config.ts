import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/server-options.ts'],
  externals: ['unstorage', 'defu', 'h3', 'pathe'],
  replace: {
    'import.meta.env.VITEST_SERVER': 'undefined',
    'import.meta.env.VITEST': 'undefined',
  },
})
