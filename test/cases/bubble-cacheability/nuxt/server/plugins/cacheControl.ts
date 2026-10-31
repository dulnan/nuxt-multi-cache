import { defineNitroPlugin } from 'nitropack/runtime'

// Sets the Cache-Control header after the CDN headers have been applied.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    if (event.path === '/cdn-private-render-response' && response.headers) {
      response.headers['cache-control'] = 'public, max-age=60'
    }
  })
})
