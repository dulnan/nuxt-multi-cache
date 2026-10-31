import { getCookie } from 'h3'
import { defineMultiCacheOptions } from './../../../../../src/server-options'

export default defineMultiCacheOptions(() => {
  return {
    // Subscribers get their own cache items, everyone else none.
    cacheKeyPrefix: (event) =>
      Promise.resolve(getCookie(event, 'plan') === 'premium' ? 'premium' : ''),
  }
})
