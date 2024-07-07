import { defineEventHandler, getRequestHeader, createError } from 'h3'
import { useRouteCache } from '#nuxt-multi-cache/composables'

export default defineEventHandler((event) => {
  const shouldThrow = getRequestHeader(event, 'x-nuxt-throw-error')
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(0).setStaleIfError(9000)
  }, event)

  if (shouldThrow === 'true') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Backend not available.',
    })
  }

  return {
    data: `Response successful, generated at ${Date.now()}`,
  }
})
