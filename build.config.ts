import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: ['unstorage', 'defu', 'h3'],
  hooks: {
    'build:prepare'(ctx) {
      ctx.options.entries.push({
        builder: 'mkdist',
        input: 'src/runtime/serverOptions',
        outDir: 'dist/runtime/serverOptions',
        ext: 'mjs',
      })
    },
  },
})
