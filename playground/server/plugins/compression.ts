import { useCompression } from 'h3-compression'
import { getRequestURL } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const url = getRequestURL(event)
    if (
      !url.pathname.startsWith('/testCompression') &&
      !url.pathname.startsWith('/api/testApiCompression')
    ) {
      return
    }

    await useCompression(event, response)
  })
})
