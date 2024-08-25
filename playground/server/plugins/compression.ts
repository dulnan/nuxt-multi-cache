import { useCompression } from 'h3-compression'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    if (
      !event.path.startsWith('/testCompression') &&
      !event.path.startsWith('/api/testApiCompression')
    ) {
      return
    }

    await useCompression(event, response)
  })
})
