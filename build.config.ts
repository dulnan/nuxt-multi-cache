import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: ['unstorage', 'defu', 'h3', 'pathe'],
  replace: {
    'import.meta.env.VITEST_SERVER': 'undefined',
  },
})
