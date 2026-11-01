import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      // Like a cookie for the visitor's session, the header set by the request
      // hook (see plugins/requestId.ts) is not stored with cached routes.
      alterCachedHeaders(headers) {
        headers['x-request-id'] = undefined
        return headers
      },
    },
  }
})
