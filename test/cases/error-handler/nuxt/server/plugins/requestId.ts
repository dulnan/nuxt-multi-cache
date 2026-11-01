import { setResponseHeader } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

/**
 * Sets a header for each request before any handler runs, so that cache hits
 * have it too.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    setResponseHeader(event, 'x-request-id', crypto.randomUUID())
  })
})
