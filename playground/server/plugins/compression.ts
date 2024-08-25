import { useCompression } from 'h3-compression'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    if (!event.path.startsWith('/testCompression')) {
      return
    }

    await useCompression(event, response)
  })
})
