import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions({
  route: {
    alterCachedHeaders(headers) {
      const cookie = headers['set-cookie']
      // Remove the SESSION cookie.
      if (cookie) {
        if (typeof cookie === 'string') {
          if (cookie.includes('SESSION')) {
            headers['set-cookie'] = undefined
          }
        } else if (Array.isArray(cookie)) {
          const remaining = cookie.filter((v) => !v.includes('SESSION'))
          if (!remaining.length) {
            headers['set-cookie'] = undefined
          } else {
            headers['set-cookie'] = remaining
          }
        }
      }
      return headers
    },
  },
})
