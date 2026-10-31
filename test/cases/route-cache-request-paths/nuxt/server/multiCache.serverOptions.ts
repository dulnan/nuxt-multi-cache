import { getCookie } from 'h3'
import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      // The checkout page is user-specific.
      applies: (path) => !path.startsWith('/checkout'),
    },
    api: {
      authorization: (event) =>
        Promise.resolve(getCookie(event, 'admin') === 'yes'),
    },
  }
})
