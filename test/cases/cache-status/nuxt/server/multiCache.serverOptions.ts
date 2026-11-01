import { getHeader } from 'h3'
import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions(() => {
  return {
    // Skips the caches for requests with this header, like an app would for
    // requests with a session cookie.
    enabledForRequest: (event) => {
      return Promise.resolve(!getHeader(event, 'x-skip-cache'))
    },
  }
})
