import { defineEventHandler, setResponseHeader } from 'h3'

// Like a server outside of the app that sends the internal headers of the
// module.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'x-nuxt-multi-cache-cache-tags', 'injected')
  setResponseHeader(event, 'x-nuxt-multi-cache-uncacheable', 'true')

  return {
    timestamp: Date.now(),
  }
})
