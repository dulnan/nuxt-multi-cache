import { defineTemplate } from '../defineTemplate'

export default defineTemplate(
  {
    path: 'nuxt-multi-cache/server-options',
  },
  (helper) => {
    const resolvedPathRelative = helper.paths.serverOptions
      ? helper.toModuleBuildRelative(helper.paths.serverOptions)
      : null
    const serverOptionsLine = resolvedPathRelative
      ? `import serverOptions from '${resolvedPathRelative}'`
      : `const serverOptions = {}`
    return `
${serverOptionsLine}
export { serverOptions }
`
  },
  (helper) => {
    return `
import type { MultiCacheServerOptions } from '${helper.paths.runtimeTypes}'

export declare const serverOptions: MultiCacheServerOptions
`
  },
)
