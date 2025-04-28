import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/server-options.ts'],
  externals: ['unstorage', 'defu', 'h3', 'pathe', 'unplugin'],
})
