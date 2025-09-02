import { defineMultiCacheOptions } from './../../../../../src/server-options'
import { getCookie } from 'h3'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      alterCachedHeaders(headers) {
        headers['x-cache'] = 'HIT'
        headers['set-cookie'] = undefined
        return headers
      },
    },

    enabledForRequest: function (event) {
      if (getCookie(event, 'COOKIE_KEY_SESSION_TOKEN')) {
        return Promise.resolve(false)
      }

      return Promise.resolve(true)
    },
  }
})
