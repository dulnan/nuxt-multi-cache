import { defineNitroPlugin } from 'nitropack/runtime'
import { capturedErrorTags } from '../utils/capturedErrorTags'

/**
 * Records how Nitro captured errors, so that tests can check how an error was
 * reported.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (_error, context) => {
    capturedErrorTags.push(context.tags ?? [])
  })
})
