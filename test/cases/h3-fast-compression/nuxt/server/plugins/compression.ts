import { useCompression } from 'h3-fast-compression'
import { getResponseHeader } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const headerValue = getResponseHeader(event, 'content-type')
    const contentType = Array.isArray(headerValue) ? headerValue : [headerValue]
    const isApplicable = contentType.find(
      (v) => typeof v === 'string' && v.includes('text/html'),
    )
    if (isApplicable) {
      await useCompression(event, response)
    }
  })
})
